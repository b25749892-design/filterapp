package com.filtertap.app.ui

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.FilterAlt
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.WaterDrop
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import com.filtertap.app.domain.Entry
import com.filtertap.app.ui.screens.EntriesScreen
import com.filtertap.app.ui.screens.EntryEditor
import com.filtertap.app.ui.screens.FiltersScreen
import com.filtertap.app.ui.screens.SettingsScreen
import com.filtertap.app.ui.screens.TrackerScreen
import java.time.LocalDate
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue

private const val WIDE_BREAKPOINT_DP = 840
private const val MAX_CONTENT_WIDTH_DP = 720

private enum class Tab(val label: String, val icon: @Composable () -> Unit) {
    Tracker("Tracker", { Icon(Icons.Filled.WaterDrop, contentDescription = null) }),
    Entries("Entries", { Icon(Icons.AutoMirrored.Filled.List, contentDescription = null) }),
    Filters("Filters", { Icon(Icons.Filled.FilterAlt, contentDescription = null) }),
    Settings("Settings", { Icon(Icons.Filled.Settings, contentDescription = null) }),
}

/** What the entry editor is currently doing, if anything. */
private sealed interface Editor {
    data class New(val liters: Double?) : Editor
    data class Edit(val entry: Entry) : Editor
}

@Composable
fun FilterTapRoot(viewModel: AppViewModel) {
    val state by viewModel.state.collectAsState()
    val snackbar = remember { SnackbarHostState() }
    var tabIndex by rememberSaveable { mutableIntStateOf(0) }
    var editor by remember { mutableStateOf<Editor?>(null) }
    val tab = Tab.entries[tabIndex]

    LaunchedEffect(viewModel) {
        viewModel.messages.collect { message ->
            val action = if (message.undoEntryId != null) "Undo" else null
            val result = snackbar.showSnackbar(
                message = message.text,
                actionLabel = action,
                duration = SnackbarDuration.Short,
            )
            if (result == SnackbarResult.ActionPerformed && message.undoEntryId != null) {
                viewModel.undo(message.undoEntryId)
            }
        }
    }

    val exportJson = rememberLauncherForActivityResult(
        ActivityResultContracts.CreateDocument("application/json"),
    ) { uri -> if (uri != null) viewModel.exportBackup(uri) }

    val exportCsv = rememberLauncherForActivityResult(
        ActivityResultContracts.CreateDocument("text/csv"),
    ) { uri -> if (uri != null) viewModel.exportCsv(uri) }

    val restore = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocument(),
    ) { uri -> if (uri != null) viewModel.restoreBackup(uri) }

    val wide = LocalConfiguration.current.screenWidthDp >= WIDE_BREAKPOINT_DP

    val body: @Composable (PaddingValues) -> Unit = { inner ->
        // Content is capped at a readable width and centred on tablets and desktops.
        Box(
            modifier = Modifier.fillMaxSize().padding(inner),
            contentAlignment = Alignment.TopCenter,
        ) {
            Box(modifier = Modifier.fillMaxSize().widthIn(max = MAX_CONTENT_WIDTH_DP.dp)) {
                when (tab) {
                    Tab.Tracker -> TrackerScreen(
                        state = state,
                        onLogQuick = { liters -> viewModel.logVolume(liters, state.settings.lastPerson) },
                        onOtherAmount = { editor = Editor.New(null) },
                        onSelectPerson = viewModel::selectPerson,
                        onAddPerson = viewModel::addPerson,
                        onOpenEntry = { editor = Editor.Edit(it) },
                        onOpenEntries = { tabIndex = Tab.Entries.ordinal },
                    )
                    Tab.Entries -> EntriesScreen(
                        state = state,
                        onOpen = { editor = Editor.Edit(it) },
                        onAdd = { editor = Editor.New(null) },
                    )
                    Tab.Filters -> FiltersScreen(
                        state = state,
                        onSaveCycle = viewModel::saveCycle,
                        onReset = viewModel::resetFilter,
                    )
                    Tab.Settings -> SettingsScreen(
                        state = state,
                        onSetAppName = viewModel::setAppName,
                        onSetDefaultTarget = viewModel::setDefaultTarget,
                        onSetQuickAmounts = viewModel::setQuickAmounts,
                        onSetHaptics = viewModel::setHaptics,
                        onAddPerson = viewModel::addPerson,
                        onRenamePerson = viewModel::renamePerson,
                        onRemovePerson = viewModel::removePerson,
                        onExportBackup = { exportJson.launch("FilterTap-backup-${LocalDate.now(zone)}.json") },
                        onRestoreBackup = { restore.launch(arrayOf("application/json", "text/plain", "*/*")) },
                        onExportCsv = { exportCsv.launch("FilterTap-entries-${LocalDate.now(zone)}.csv") },
                        onWipe = viewModel::wipe,
                    )
                }
            }
        }
    }

    if (wide) {
        Row(modifier = Modifier.fillMaxSize()) {
            NavigationRail {
                Tab.entries.forEachIndexed { index, item ->
                    NavigationRailItem(
                        selected = index == tabIndex,
                        onClick = { tabIndex = index },
                        icon = item.icon,
                        label = { Text(item.label) },
                    )
                }
            }
            Scaffold(
                modifier = Modifier.weight(1f),
                snackbarHost = { SnackbarHost(snackbar) },
                content = body,
            )
        }
    } else {
        Scaffold(
            bottomBar = {
                NavigationBar {
                    Tab.entries.forEachIndexed { index, item ->
                        NavigationBarItem(
                            selected = index == tabIndex,
                            onClick = { tabIndex = index },
                            icon = item.icon,
                            label = { Text(item.label) },
                        )
                    }
                }
            },
            snackbarHost = { SnackbarHost(snackbar) },
            content = body,
        )
    }

    when (val current = editor) {
        null -> Unit
        is Editor.New -> EntryEditor(
            existing = null,
            people = state.settings.people,
            defaultPerson = state.settings.lastPerson,
            initialLiters = current.liters,
            onSave = { liters, timestamp, person, note ->
                editor = null
                viewModel.saveEntry(null, liters, timestamp, person, note)
            },
            onDelete = null,
            onDismiss = { editor = null },
        )
        is Editor.Edit -> EntryEditor(
            existing = current.entry,
            people = state.settings.people,
            defaultPerson = current.entry.person,
            initialLiters = null,
            onSave = { liters, timestamp, person, note ->
                editor = null
                viewModel.saveEntry(current.entry.id, liters, timestamp, person, note)
            },
            onDelete = {
                editor = null
                viewModel.deleteEntry(current.entry.id)
            },
            onDismiss = { editor = null },
        )
    }
}
