package com.filtertap.app.data

import androidx.room.withTransaction
import com.filtertap.app.domain.Cycle
import com.filtertap.app.domain.Entry
import com.filtertap.app.domain.SOURCE_MANUAL
import com.filtertap.app.domain.SOURCE_QUICK
import com.filtertap.app.domain.SOURCE_RETRO
import com.filtertap.app.domain.Settings
import com.filtertap.app.domain.cycleFor
import com.filtertap.app.domain.newId
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.time.ZoneId

private const val ONE_HOUR_MS = 3_600_000L

/**
 * The single place where data changes happen. Every rule that keeps the data
 * consistent (one active filter, entries always attached to the right filter)
 * is enforced here.
 */
class FilterRepository(
    private val db: FilterDatabase,
    private val store: SettingsStore,
) {
    private val dao = db.dao()
    private val settingsLock = Mutex()

    val settings: Flow<Settings> = store.settings
    val cycles: Flow<List<Cycle>> = dao.observeCycles().map { rows -> rows.map { it.toModel() } }
    val entries: Flow<List<Entry>> = dao.observeEntries().map { rows -> rows.map { it.toModel() } }

    private suspend fun allCycles(): List<Cycle> = dao.cycles().map { it.toModel() }

    private suspend fun allEntries(): List<Entry> = dao.entries().map { it.toModel() }

    /** Makes sure there is exactly one filter in use. Creates the first filter on a fresh install. */
    suspend fun ensureCycle(now: Long) {
        val existing = allCycles()
        when {
            existing.isEmpty() -> {
                val target = store.settings.first().defaultTargetLiters
                dao.upsertCycle(Cycle(newId(), "Filter #1", now, null, target.toDouble()).toEntity())
            }
            existing.none { it.isActive } -> {
                // Most recent filter becomes the active one again.
                dao.upsertCycle(existing.first().copy(endMillis = null).toEntity())
            }
        }
    }

    suspend fun logVolume(liters: Double, person: String, now: Long): String {
        val cycle = cycleFor(now, allCycles()) ?: error("No filter in use")
        val id = newId()
        dao.upsertEntry(
            Entry(id, cycle.id, now, liters, person, "", SOURCE_QUICK, now, now).toEntity()
        )
        rememberPerson(person)
        return id
    }

    /** Adds a new entry (when [existingId] is null) or updates one. The filter is chosen from the timestamp. */
    suspend fun saveEntry(
        existingId: String?,
        liters: Double,
        timestamp: Long,
        person: String,
        note: String,
        now: Long,
    ): String {
        val cycle = cycleFor(timestamp, allCycles()) ?: error("No filter in use")
        val old = existingId?.let { dao.entry(it)?.toModel() }
        val id = old?.id ?: newId()
        val source = old?.source
            ?: if (timestamp < now - ONE_HOUR_MS) SOURCE_RETRO else SOURCE_MANUAL
        dao.upsertEntry(
            Entry(
                id = id,
                cycleId = cycle.id,
                timestampMillis = timestamp,
                liters = liters,
                person = person,
                note = note,
                source = source,
                createdAtMillis = old?.createdAtMillis ?: now,
                updatedAtMillis = now,
            ).toEntity()
        )
        rememberPerson(person)
        return id
    }

    suspend fun deleteEntry(id: String) {
        dao.deleteEntry(id)
    }

    suspend fun selectPerson(name: String) = modifySettings { s ->
        if (name in s.people) s.copy(lastPerson = name) else s
    }

    suspend fun addPerson(name: String) = modifySettings { s ->
        s.copy(people = s.people + name, lastPerson = name)
    }

    suspend fun renamePerson(old: String, new: String) {
        modifySettings { s ->
            s.copy(
                people = s.people.map { if (it == old) new else it }.distinct(),
                lastPerson = if (s.lastPerson == old) new else s.lastPerson,
            )
        }
        val now = System.currentTimeMillis()
        val changed = allEntries()
            .filter { it.person == old }
            .map { it.copy(person = new, updatedAtMillis = now).toEntity() }
        if (changed.isNotEmpty()) dao.upsertEntries(changed)
    }

    suspend fun removePerson(name: String) = modifySettings { s ->
        val remaining = s.people.filter { it != name }
        if (remaining.isEmpty()) {
            s
        } else {
            s.copy(
                people = remaining,
                lastPerson = if (s.lastPerson == name) remaining.first() else s.lastPerson,
            )
        }
    }

    suspend fun setActiveTarget(target: Int) {
        allCycles().firstOrNull { it.isActive }?.let { active ->
            dao.upsertCycle(active.copy(targetLiters = target.toDouble()).toEntity())
        }
        modifySettings { it.copy(defaultTargetLiters = target) }
    }

    /** Saves edits to a filter's name, dates, capacity or notes, then re-attaches entries to the right filter. */
    suspend fun saveCycle(cycle: Cycle) {
        db.withTransaction {
            dao.upsertCycle(cycle.toEntity())
            reassignEntries()
        }
    }

    /**
     * Archives the filter in use at [replaceAt] and starts a new one. Entries logged
     * at or after [replaceAt] move to the new filter.
     */
    suspend fun resetFilter(name: String, target: Int, replaceAt: Long, reason: String) {
        db.withTransaction {
            val active = allCycles().first { it.isActive }
            dao.upsertCycle(active.copy(endMillis = replaceAt, resetReason = reason).toEntity())
            dao.upsertCycle(
                Cycle(newId(), name, replaceAt, null, target.toDouble()).toEntity()
            )
            reassignEntries()
        }
        modifySettings { it.copy(defaultTargetLiters = target) }
    }

    suspend fun modifySettings(transform: (Settings) -> Settings) {
        settingsLock.withLock {
            store.write(transform(store.settings.first()))
        }
    }

    suspend fun wipe(now: Long) {
        db.withTransaction {
            dao.clearEntries()
            dao.clearCycles()
        }
        store.write(Settings())
        ensureCycle(now)
    }

    suspend fun backupJson(now: Long): String =
        Backup.encode(store.settings.first(), allCycles(), allEntries(), now)

    suspend fun csv(): String = Backup.csv(allEntries(), allCycles(), ZoneId.systemDefault())

    /** Replaces all data with the backup. Nothing changes if the file is invalid. */
    suspend fun restore(text: String, now: Long): Result<Unit> = runCatching {
        val decoded = Backup.decode(text)
        db.withTransaction {
            dao.clearEntries()
            dao.clearCycles()
            dao.upsertCycles(decoded.cycles.map { it.toEntity() })
            dao.upsertEntries(decoded.entries.map { it.toEntity() })
            reassignEntries()
        }
        store.write(decoded.settings)
        ensureCycle(now)
    }

    private suspend fun rememberPerson(name: String) = modifySettings { s ->
        val existing = s.people.firstOrNull { it.equals(name, ignoreCase = true) }
        if (existing != null) {
            s.copy(lastPerson = existing)
        } else {
            s.copy(people = s.people + name, lastPerson = name)
        }
    }

    private suspend fun reassignEntries() {
        val cycles = allCycles()
        val changed = allEntries().mapNotNull { e ->
            val target = cycleFor(e.timestampMillis, cycles)?.id
            if (target != null && target != e.cycleId) e.copy(cycleId = target).toEntity() else null
        }
        if (changed.isNotEmpty()) dao.upsertEntries(changed)
    }
}

private fun CycleEntity.toModel() =
    Cycle(id, name, startMillis, endMillis, targetLiters, notes, resetReason)

private fun Cycle.toEntity() =
    CycleEntity(id, name, startMillis, endMillis, targetLiters, notes, resetReason)

private fun EntryEntity.toModel() =
    Entry(id, cycleId, timestampMillis, liters, person, note, source, createdAtMillis, updatedAtMillis)

private fun Entry.toEntity() =
    EntryEntity(id, cycleId, timestampMillis, liters, person, note, source, createdAtMillis, updatedAtMillis)
