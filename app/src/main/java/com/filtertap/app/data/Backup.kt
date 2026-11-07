package com.filtertap.app.data

import com.filtertap.app.domain.Cycle
import com.filtertap.app.domain.Entry
import com.filtertap.app.domain.MAX_CYCLE_NAME_LENGTH
import com.filtertap.app.domain.MAX_LITERS
import com.filtertap.app.domain.MAX_NOTE_LENGTH
import com.filtertap.app.domain.MAX_QUICK_AMOUNTS
import com.filtertap.app.domain.MAX_TARGET
import com.filtertap.app.domain.MIN_LITERS
import com.filtertap.app.domain.MIN_TARGET
import com.filtertap.app.domain.SOURCE_MANUAL
import com.filtertap.app.domain.SOURCE_QUICK
import com.filtertap.app.domain.SOURCE_RETRO
import com.filtertap.app.domain.Settings
import com.filtertap.app.domain.cleanName
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * JSON backup and CSV export.
 *
 * The backup layout matches the web version of FilterTap, so a backup made there
 * can be restored here.
 */
object Backup {
    private const val APP_ID = "FilterTap"
    private const val FORMAT_VERSION = 2

    class Decoded(
        val settings: Settings,
        val cycles: List<Cycle>,
        val entries: List<Entry>,
    )

    fun encode(settings: Settings, cycles: List<Cycle>, entries: List<Entry>, now: Long): String {
        val root = JSONObject()
        root.put("app", APP_ID)
        root.put("version", FORMAT_VERSION)
        root.put("exportedAt", iso(now))
        root.put(
            "settings",
            JSONObject()
                .put("appName", settings.appName)
                .put("defaultTargetLiters", settings.defaultTargetLiters)
                .put("quickAmounts", JSONArray(settings.quickAmounts))
                .put("hapticsEnabled", settings.hapticsEnabled)
                .put("waterUnit", "L")
                .put("savedPeople", JSONArray(settings.people))
                .put("lastSelectedPerson", settings.lastPerson),
        )
        root.put("cycles", JSONArray().apply {
            cycles.forEach { c ->
                put(
                    JSONObject()
                        .put("id", c.id)
                        .put("name", c.name)
                        .put("startDate", iso(c.startMillis))
                        .put("endDate", c.endMillis?.let { iso(it) } ?: JSONObject.NULL)
                        .put("targetLiters", c.targetLiters)
                        .put("status", if (c.isActive) "active" else "completed")
                        .put("notes", c.notes)
                        .put("resetReason", c.resetReason),
                )
            }
        })
        root.put("entries", JSONArray().apply {
            entries.forEach { e ->
                put(
                    JSONObject()
                        .put("id", e.id)
                        .put("cycleId", e.cycleId)
                        .put("timestamp", iso(e.timestampMillis))
                        .put("volume", e.liters)
                        .put("person", e.person)
                        .put("note", e.note)
                        .put("source", e.source)
                        .put("createdAt", iso(e.createdAtMillis))
                        .put("updatedAt", iso(e.updatedAtMillis)),
                )
            }
        })
        return root.toString(2)
    }

    /** Throws [IllegalArgumentException] or [org.json.JSONException] when the file is not a valid backup. */
    fun decode(text: String): Decoded {
        val root = JSONObject(text)
        require(root.optString("app") == APP_ID) { "This file is not a FilterTap backup." }

        val s = root.getJSONObject("settings")
        val defaults = Settings()
        val people = (s.optJSONArray("savedPeople")?.strings() ?: emptyList())
            .map { cleanName(it) }
            .filter { it.isNotEmpty() }
            .distinctBy { it.lowercase(Locale.ROOT) }
            .ifEmpty { defaults.people }
        val quick = (s.optJSONArray("quickAmounts")?.doubles() ?: emptyList())
            .filter { it in MIN_LITERS..MAX_LITERS }
            .distinct()
            .sorted()
            .take(MAX_QUICK_AMOUNTS)
            .ifEmpty { defaults.quickAmounts }
        val lastPerson = cleanName(s.optString("lastSelectedPerson", ""))
            .takeIf { it in people } ?: people.first()
        val settings = Settings(
            appName = s.optString("appName", defaults.appName).trim().ifEmpty { defaults.appName }.take(30),
            defaultTargetLiters = s.optInt("defaultTargetLiters", defaults.defaultTargetLiters)
                .coerceIn(MIN_TARGET, MAX_TARGET),
            quickAmounts = quick,
            hapticsEnabled = s.optBoolean("hapticsEnabled", true),
            people = people,
            lastPerson = lastPerson,
        )

        val cycleArr = root.getJSONArray("cycles")
        val cycles = (0 until cycleArr.length()).map { i ->
            val o = cycleArr.getJSONObject(i)
            val endRaw = o.opt("endDate")
            val endMillis = if (o.optString("status") == "active" || endRaw == null || endRaw == JSONObject.NULL) {
                null
            } else {
                instant(endRaw as String)
            }
            Cycle(
                id = o.getString("id"),
                name = cleanName(o.optString("name", "Filter")).ifEmpty { "Filter" }.take(MAX_CYCLE_NAME_LENGTH),
                startMillis = instant(o.getString("startDate")),
                endMillis = endMillis,
                targetLiters = o.optDouble("targetLiters", defaults.defaultTargetLiters.toDouble())
                    .coerceIn(MIN_TARGET.toDouble(), MAX_TARGET.toDouble()),
                notes = o.optString("notes", "").take(MAX_NOTE_LENGTH),
                resetReason = o.optString("resetReason", "").take(MAX_NOTE_LENGTH),
            )
        }
        require(cycles.isNotEmpty()) { "The backup has no filters." }

        val entryArr = root.getJSONArray("entries")
        val entries = (0 until entryArr.length()).map { i ->
            val o = entryArr.getJSONObject(i)
            val liters = o.getDouble("volume")
            require(liters in MIN_LITERS..MAX_LITERS) { "Entry ${i + 1} has an invalid amount." }
            val timestamp = instant(o.getString("timestamp"))
            val source = when (o.optString("source")) {
                SOURCE_QUICK -> SOURCE_QUICK
                SOURCE_RETRO -> SOURCE_RETRO
                else -> SOURCE_MANUAL
            }
            Entry(
                id = o.getString("id"),
                cycleId = o.getString("cycleId"),
                timestampMillis = timestamp,
                liters = liters,
                person = cleanName(o.optString("person", "")).ifEmpty { people.first() },
                note = o.optString("note", "").take(MAX_NOTE_LENGTH),
                source = source,
                createdAtMillis = o.optString("createdAt").let { if (it.isEmpty()) timestamp else instant(it) },
                updatedAtMillis = o.optString("updatedAt").let { if (it.isEmpty()) timestamp else instant(it) },
            )
        }

        return Decoded(settings, cycles, entries)
    }

    fun csv(entries: List<Entry>, cycles: List<Cycle>, zone: ZoneId): String {
        val names = cycles.associate { it.id to it.name }
        val date = DateTimeFormatter.ISO_LOCAL_DATE
        val time = DateTimeFormatter.ofPattern("HH:mm", Locale.ROOT)
        val sb = StringBuilder("Date,Time,Person,Liters,Filter,Note\n")
        entries.sortedBy { it.timestampMillis }.forEach { e ->
            val local = Instant.ofEpochMilli(e.timestampMillis).atZone(zone)
            val row = listOf(
                local.format(date),
                local.format(time),
                e.person,
                String.format(Locale.US, "%.1f", e.liters),
                names[e.cycleId] ?: "",
                e.note,
            )
            sb.append(row.joinToString(",") { quote(it) }).append('\n')
        }
        return sb.toString()
    }

    private fun quote(value: String): String = "\"" + value.replace("\"", "\"\"") + "\""

    private fun iso(millis: Long): String = Instant.ofEpochMilli(millis).toString()

    private fun instant(text: String): Long = Instant.parse(text).toEpochMilli()

    private fun JSONArray.strings(): List<String> = (0 until length()).map { getString(it) }

    private fun JSONArray.doubles(): List<Double> = (0 until length()).map { getDouble(it) }
}
