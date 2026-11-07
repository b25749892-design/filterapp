package com.filtertap.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.filtertap.app.domain.MAX_QUICK_AMOUNTS
import com.filtertap.app.domain.MAX_STATION_NAME_LENGTH
import com.filtertap.app.domain.QUICK_AMOUNT_CHOICES
import com.filtertap.app.domain.nameError
import com.filtertap.app.domain.targetError
import com.filtertap.app.domain.parseTarget
import com.filtertap.app.domain.cleanName
import com.filtertap.app.ui.AppState
import com.filtertap.app.ui.fmtAmount
import com.filtertap.app.ui.components.ConfirmDialog
import com.filtertap.app.ui.components.SectionLabel
import com.filtertap.app.ui.components.TextPromptDialog
import com.filtertap.app.ui.components.SurfaceCard
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue

private sealed interface PersonDialog {
    data object Add : PersonDialog
    data class Rename(val name: String) : PersonDialog
    data class Remove(val name: String) : PersonDialog
}

@Composable
fun SettingsScreen(
    state: AppState,
    onSetAppName: (String) -> Unit,
    onSetDefaultTarget: (Int) -> Unit,
    onSetQuickAmounts: (List<Double>) -> Unit,
    onSetHaptics: (Boolean) -> Unit,
    onAddPerson: (String) -> Unit,
    onRenamePerson: (String, String) -> Unit,
    onRemovePerson: (String) -> Unit,
    onExportBackup: () -> Unit,
    onRestoreBackup: () -> Unit,
    onExportCsv: () -> Unit,
    onWipe: () -> Unit,
) {
    val settings = state.settings
    var personDialog by remember { mutableStateOf<PersonDialog?>(null) }
    var editingName by remember { mutableStateOf(false) }
    var editingTarget by remember { mutableStateOf(false) }
    var confirmWipe by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.statusBarsPadding(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 32.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        item {
            Text(
                text = "Settings",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface,
            )
        }

        item {
            SurfaceCard {
                SettingRow(label = "Station name", value = settings.appName, onClick = { editingName = true })
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                SettingRow(
                    label = "Default capacity",
                    value = "${fmtAmount(settings.defaultTargetLiters.toDouble())} L",
                    onClick = { editingTarget = true },
                )
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Haptic feedback", style = MaterialTheme.typography.bodyLarge)
                    Switch(checked = settings.hapticsEnabled, onCheckedChange = onSetHaptics)
                }
            }
        }

        item {
            SurfaceCard {
                SectionLabel("Quick amounts (choose 1 to $MAX_QUICK_AMOUNTS)")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    QUICK_AMOUNT_CHOICES.forEach { amount ->
                        val selected = amount in settings.quickAmounts
                        FilterChip(
                            selected = selected,
                            onClick = {
                                val next = when {
                                    selected && settings.quickAmounts.size > 1 -> settings.quickAmounts - amount
                                    !selected && settings.quickAmounts.size < MAX_QUICK_AMOUNTS ->
                                        (settings.quickAmounts + amount).sorted()
                                    else -> settings.quickAmounts
                                }
                                onSetQuickAmounts(next)
                            },
                            label = { Text(fmtAmount(amount) + " L") },
                        )
                    }
                }
            }
        }

        item {
            SurfaceCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    SectionLabel("People")
                    TextButton(onClick = { personDialog = PersonDialog.Add }) { Text("Add") }
                }
                settings.people.forEachIndexed { index, name ->
                    if (index > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(name, style = MaterialTheme.typography.bodyLarge)
                        Row {
                            TextButton(onClick = { personDialog = PersonDialog.Rename(name) }) { Text("Rename") }
                            if (settings.people.size > 1) {
                                TextButton(onClick = { personDialog = PersonDialog.Remove(name) }) {
                                    Text("Remove", color = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    }
                }
            }
        }

        item {
            SurfaceCard {
                SectionLabel("Data")
                OutlinedButton(onClick = onExportBackup, modifier = Modifier.fillMaxWidth()) {
                    Text("Export backup (JSON)")
                }
                OutlinedButton(onClick = onRestoreBackup, modifier = Modifier.fillMaxWidth()) {
                    Text("Restore from backup")
                }
                OutlinedButton(onClick = onExportCsv, modifier = Modifier.fillMaxWidth()) {
                    Text("Export entries (CSV)")
                }
                TextButton(onClick = { confirmWipe = true }, modifier = Modifier.fillMaxWidth()) {
                    Text("Erase all data", color = MaterialTheme.colorScheme.error)
                }
            }
        }

        item {
            Text(
                text = "FilterTap keeps everything on this device.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 4.dp).navigationBarsPadding(),
            )
        }
    }

    if (editingName) {
        TextPromptDialog(
            title = "Station name",
            label = "Name",
            initial = settings.appName,
            confirmLabel = "Save",
            validate = { name ->
                val cleaned = cleanName(name)
                when {
                    cleaned.isEmpty() -> "Enter a name"
                    cleaned.length > MAX_STATION_NAME_LENGTH -> "Keep it under $MAX_STATION_NAME_LENGTH characters"
                    else -> null
                }
            },
            onConfirm = {
                editingName = false
                onSetAppName(cleanName(it))
            },
            onDismiss = { editingName = false },
        )
    }

    if (editingTarget) {
        TextPromptDialog(
            title = "Default capacity (L)",
            label = "Litres",
            initial = settings.defaultTargetLiters.toString(),
            confirmLabel = "Save",
            validate = { targetError(it) },
            keyboard = KeyboardType.Number,
            onConfirm = {
                editingTarget = false
                parseTarget(it)?.let(onSetDefaultTarget)
            },
            onDismiss = { editingTarget = false },
        )
    }

    when (val dialog = personDialog) {
        null -> Unit
        PersonDialog.Add -> TextPromptDialog(
            title = "Add a person",
            label = "Name",
            initial = "",
            confirmLabel = "Add",
            validate = { nameError(it, settings.people) },
            onConfirm = {
                personDialog = null
                onAddPerson(it)
            },
            onDismiss = { personDialog = null },
        )
        is PersonDialog.Rename -> TextPromptDialog(
            title = "Rename ${dialog.name}",
            label = "Name",
            initial = dialog.name,
            confirmLabel = "Save",
            validate = { nameError(it, settings.people, current = dialog.name) },
            onConfirm = {
                personDialog = null
                onRenamePerson(dialog.name, it)
            },
            onDismiss = { personDialog = null },
        )
        is PersonDialog.Remove -> ConfirmDialog(
            title = "Remove ${dialog.name}?",
            text = "Their past entries stay in the log.",
            confirmLabel = "Remove",
            destructive = true,
            onConfirm = {
                personDialog = null
                onRemovePerson(dialog.name)
            },
            onDismiss = { personDialog = null },
        )
    }

    if (confirmWipe) {
        ConfirmDialog(
            title = "Erase all data?",
            text = "All filters, entries and settings will be deleted from this device. Export a backup first if you want to keep them.",
            confirmLabel = "Erase",
            destructive = true,
            onConfirm = {
                confirmWipe = false
                onWipe()
            },
            onDismiss = { confirmWipe = false },
        )
    }
}

@Composable
private fun SettingRow(label: String, value: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, style = MaterialTheme.typography.bodyLarge)
        TextButton(onClick = onClick) {
            Text(value, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
