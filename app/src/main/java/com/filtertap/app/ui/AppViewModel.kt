package com.filtertap.app.ui

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.filtertap.app.data.FilterRepository
import com.filtertap.app.domain.Cycle
import com.filtertap.app.domain.Entry
import com.filtertap.app.domain.Settings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class AppState(
    /** False until the first filter exists. */
    val loaded: Boolean = false,
    val settings: Settings = Settings(),
    val cycles: List<Cycle> = emptyList(),
    val entries: List<Entry> = emptyList(),
) {
    val active: Cycle? get() = cycles.firstOrNull { it.isActive }

    val activeEntries: List<Entry>
        get() = active?.let { c -> entries.filter { it.cycleId == c.id } } ?: emptyList()
}

data class UiMessage(val text: String, val undoEntryId: String? = null)

class AppViewModel(
    app: Application,
    private val repo: FilterRepository,
) : AndroidViewModel(app) {

    val state: StateFlow<AppState> = combine(repo.settings, repo.cycles, repo.entries) { s, c, e ->
        AppState(loaded = c.isNotEmpty(), settings = s, cycles = c, entries = e)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), AppState())

    private val messageChannel = Channel<UiMessage>(Channel.BUFFERED)
    val messages: Flow<UiMessage> = messageChannel.receiveAsFlow()

    init {
        launchAction { repo.ensureCycle(nowMillis()) }
    }

    private fun say(text: String, undoEntryId: String? = null) {
        messageChannel.trySend(UiMessage(text, undoEntryId))
    }

    private fun launchAction(block: suspend () -> Unit) {
        viewModelScope.launch {
            try {
                block()
            } catch (e: Exception) {
                say("Something went wrong. Nothing was changed.")
            }
        }
    }

    // Logging

    fun logVolume(liters: Double, person: String) = launchAction {
        val id = repo.logVolume(liters, person, nowMillis())
        say("Logged ${fmtLiters(liters)} for $person", id)
    }

    fun saveEntry(existingId: String?, liters: Double, timestamp: Long, person: String, note: String) =
        launchAction {
            repo.saveEntry(existingId, liters, timestamp, person, note, nowMillis())
            say(if (existingId == null) "Entry added" else "Entry updated")
        }

    fun deleteEntry(id: String) = launchAction {
        repo.deleteEntry(id)
        say("Entry deleted")
    }

    fun undo(entryId: String) = launchAction {
        repo.deleteEntry(entryId)
        say("Undone")
    }

    // People

    fun selectPerson(name: String) = launchAction { repo.selectPerson(name) }

    fun addPerson(name: String) = launchAction {
        repo.addPerson(name)
        say("Added $name")
    }

    fun renamePerson(old: String, new: String) = launchAction {
        repo.renamePerson(old, new)
        say("Renamed to $new")
    }

    fun removePerson(name: String) = launchAction {
        repo.removePerson(name)
        say("Removed $name")
    }

    // Filters

    fun setTarget(target: Int) = launchAction {
        repo.setActiveTarget(target)
        say("Capacity set to ${fmtAmount(target.toDouble())} L")
    }

    fun saveCycle(cycle: Cycle) = launchAction {
        repo.saveCycle(cycle)
        say("Filter details saved")
    }

    fun resetFilter(name: String, target: Int, replaceAt: Long, reason: String) = launchAction {
        repo.resetFilter(name, target, replaceAt, reason)
        say("New filter started: $name")
    }

    // Settings

    fun setAppName(name: String) = launchAction {
        repo.modifySettings { it.copy(appName = name) }
        say("Station renamed")
    }

    fun setQuickAmounts(amounts: List<Double>) = launchAction {
        repo.modifySettings { it.copy(quickAmounts = amounts) }
    }

    fun setHaptics(enabled: Boolean) = launchAction {
        repo.modifySettings { it.copy(hapticsEnabled = enabled) }
    }

    fun setDefaultTarget(target: Int) = launchAction {
        repo.modifySettings { it.copy(defaultTargetLiters = target) }
        say("Default capacity set to ${fmtAmount(target.toDouble())} L")
    }

    fun wipe() = launchAction {
        repo.wipe(nowMillis())
        say("All data erased")
    }

    // Files

    fun exportBackup(uri: Uri) = launchAction {
        val text = repo.backupJson(nowMillis())
        writeText(uri, text)
        say("Backup saved")
    }

    fun exportCsv(uri: Uri) = launchAction {
        writeText(uri, repo.csv())
        say("Entries exported")
    }

    fun restoreBackup(uri: Uri) = launchAction {
        val text = withContext(Dispatchers.IO) {
            getApplication<Application>().contentResolver.openInputStream(uri)
                ?.bufferedReader()
                ?.use { it.readText() }
        } ?: error("Cannot read file")
        repo.restore(text, nowMillis()).fold(
            onSuccess = { say("Backup restored") },
            onFailure = { say("Restore failed: ${it.message ?: "not a valid backup"}") },
        )
    }

    private suspend fun writeText(uri: Uri, text: String) {
        withContext(Dispatchers.IO) {
            val out = getApplication<Application>().contentResolver.openOutputStream(uri)
                ?: error("Cannot open file")
            out.bufferedWriter().use { it.write(text) }
        }
    }

    class Factory(
        private val app: Application,
        private val repo: FilterRepository,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            AppViewModel(app, repo) as T
    }
}
