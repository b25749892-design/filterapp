package com.filtertap.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import com.filtertap.app.domain.Cycle
import com.filtertap.app.domain.MAX_CYCLE_NAME_LENGTH
import com.filtertap.app.domain.MAX_NOTE_LENGTH
import com.filtertap.app.domain.cleanName
import com.filtertap.app.domain.cycleStats
import com.filtertap.app.domain.noteError
import com.filtertap.app.domain.nameError
import com.filtertap.app.domain.parseTarget
import com.filtertap.app.domain.targetError
import com.filtertap.app.ui.AppState
import com.filtertap.app.ui.fmtAmount
import com.filtertap.app.ui.fmtDate
import com.filtertap.app.ui.fmtLiters
import com.filtertap.app.ui.components.DateTimeField
import com.filtertap.app.ui.components.SectionLabel
import com.filtertap.app.ui.components.StatBlock
import com.filtertap.app.ui.components.StatusPill
import com.filtertap.app.ui.components.SurfaceCard
import com.filtertap.app.ui.nowMillis
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue

@Composable
fun FiltersScreen(
    state: AppState,
    onSaveCycle: (Cycle) -> Unit,
    onReset: (name: String, target: Int, replaceAt: Long, reason: String) -> Unit,
) {
    val active = state.active
    val now = nowMillis()
    var editing by remember { mutableStateOf<Cycle?>(null) }
    var resetting by remember { mutableStateOf(false) }
    val history = state.cycles.filter { !it.isActive }

    LazyColumn(
        modifier = Modifier.statusBarsPadding(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 32.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Text(
                text = "Filters",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface,
            )
        }

        if (active != null) {
            item {
                val stats = cycleStats(active, state.entries, now)
                SurfaceCard {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = active.name,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        StatusPill("In use", emphasized = true)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        StatBlock("Started", fmtDate(active.startMillis))
                        StatBlock("Capacity", fmtLiters(active.targetLiters))
                        StatBlock("Used", fmtLiters(stats.used))
                    }
                    if (active.notes.isNotBlank()) {
                        Text(
                            text = active.notes,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(onClick = { editing = active }) { Text("Edit details") }
                        Button(onClick = { resetting = true }) { Text("Replace filter") }
                    }
                }
            }
        }

        if (history.isNotEmpty()) {
            item { SectionLabel("Past filters") }
            items(history, key = { it.id }) { cycle ->
                val stats = cycleStats(cycle, state.entries, now)
                SurfaceCard(modifier = Modifier.clickable { editing = cycle }) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(
                            text = cycle.name,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        Text(
                            text = fmtAmount(stats.used) + " L used",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Text(
                        text = listOfNotNull(
                            fmtDate(cycle.startMillis) + " – " + (cycle.endMillis?.let { fmtDate(it) } ?: ""),
                            cycle.resetReason.takeIf { it.isNotBlank() },
                        ).joinToString("  ·  "),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }

    editing?.let { cycle ->
        CycleEditor(
            cycle = cycle,
            cycles = state.cycles,
            onSave = {
                onSaveCycle(it)
                editing = null
            },
            onDismiss = { editing = null },
        )
    }

    if (resetting && active != null) {
        ReplaceFilterDialog(
            nextName = "Filter #${state.cycles.size + 1}",
            activeStart = active.startMillis,
            defaultTarget = state.settings.defaultTargetLiters,
            onConfirm = { name, target, at, reason ->
                resetting = false
                onReset(name, target, at, reason)
            },
            onDismiss = { resetting = false },
        )
    }
}

@Composable
private fun ReplaceFilterDialog(
    nextName: String,
    activeStart: Long,
    defaultTarget: Int,
    onConfirm: (name: String, target: Int, replaceAt: Long, reason: String) -> Unit,
    onDismiss: () -> Unit,
) {
    var name by rememberSaveable { mutableStateOf(nextName) }
    var targetText by rememberSaveable { mutableStateOf(defaultTarget.toString()) }
    var replaceAt by rememberSaveable { mutableStateOf(nowMillis()) }
    var reason by rememberSaveable { mutableStateOf("") }

    val now = nowMillis()
    val nameProblem = nameError(name, emptyList(), max = MAX_CYCLE_NAME_LENGTH)
    val targetProblem = targetError(targetText)
    val timeProblem = when {
        replaceAt > now + 60_000L -> "Time can't be in the future"
        replaceAt <= activeStart -> "Must be after this filter started"
        else -> null
    }
    val reasonProblem = noteError(reason)
    val canSave = nameProblem == null && targetProblem == null && timeProblem == null && reasonProblem == null

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Replace filter") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text(
                    text = "The current filter will be archived. Entries logged after this time count toward the new one.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("New filter name") },
                    singleLine = true,
                    isError = nameProblem != null && name.isNotEmpty(),
                    supportingText = { if (name.isNotEmpty() && nameProblem != null) Text(nameProblem) },
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = targetText,
                    onValueChange = { targetText = it },
                    label = { Text("Capacity (L)") },
                    singleLine = true,
                    isError = targetText.isNotEmpty() && targetProblem != null,
                    supportingText = {
                        Text(if (targetText.isNotEmpty() && targetProblem != null) targetProblem else "Whole litres")
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                )
                DateTimeField(
                    label = "Replaced on",
                    millis = replaceAt,
                    onChange = { replaceAt = it },
                    error = timeProblem,
                )
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    label = { Text("Reason (optional)") },
                    singleLine = true,
                    isError = reasonProblem != null,
                    supportingText = { Text(reasonProblem ?: "${reason.length}/$MAX_NOTE_LENGTH") },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            TextButton(
                enabled = canSave,
                onClick = {
                    parseTarget(targetText)?.let { target ->
                        onConfirm(cleanName(name), target, replaceAt, reason.trim())
                    }
                },
            ) { Text("Replace") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

@Composable
private fun CycleEditor(
    cycle: Cycle,
    cycles: List<Cycle>,
    onSave: (Cycle) -> Unit,
    onDismiss: () -> Unit,
) {
    val sorted = cycles.sortedBy { it.startMillis }
    val index = sorted.indexOfFirst { it.id == cycle.id }
    val previous = sorted.getOrNull(index - 1)
    val next = sorted.getOrNull(index + 1)

    var name by rememberSaveable { mutableStateOf(cycle.name) }
    var targetText by rememberSaveable { mutableStateOf(cycle.targetLiters.toLong().toString()) }
    var start by rememberSaveable { mutableStateOf(cycle.startMillis) }
    var end by rememberSaveable { mutableStateOf(cycle.endMillis ?: 0L) }
    var notes by rememberSaveable { mutableStateOf(cycle.notes) }

    val now = nowMillis()
    val nameProblem = nameError(name, emptyList(), max = MAX_CYCLE_NAME_LENGTH)
    val targetProblem = targetError(targetText)
    val notesProblem = noteError(notes)
    val startProblem = when {
        start > now + 60_000L -> "Can't be in the future"
        previous != null && start <= previous.startMillis -> "Must be after the previous filter started"
        cycle.isActive.not() && start >= end -> "Must be before the end date"
        else -> null
    }
    val endProblem = when {
        cycle.isActive -> null
        end > now + 60_000L -> "Can't be in the future"
        next != null && end > next.startMillis -> "Must be before the next filter started"
        end <= start -> "Must be after the start date"
        else -> null
    }
    val canSave = nameProblem == null && targetProblem == null && notesProblem == null &&
        startProblem == null && endProblem == null

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Filter details") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    singleLine = true,
                    isError = nameProblem != null && name.isNotEmpty(),
                    supportingText = { if (name.isNotEmpty() && nameProblem != null) Text(nameProblem) },
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = targetText,
                    onValueChange = { targetText = it },
                    label = { Text("Capacity (L)") },
                    singleLine = true,
                    isError = targetText.isNotEmpty() && targetProblem != null,
                    supportingText = {
                        Text(if (targetText.isNotEmpty() && targetProblem != null) targetProblem else "Whole litres")
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                )
                DateTimeField(
                    label = "Started",
                    millis = start,
                    onChange = { start = it },
                    error = startProblem,
                )
                if (!cycle.isActive) {
                    DateTimeField(
                        label = "Replaced",
                        millis = end,
                        onChange = { end = it },
                        error = endProblem,
                    )
                }
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes (optional)") },
                    singleLine = true,
                    isError = notesProblem != null,
                    supportingText = { Text(notesProblem ?: "${notes.length}/$MAX_NOTE_LENGTH") },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            TextButton(
                enabled = canSave,
                onClick = {
                    parseTarget(targetText)?.let { target ->
                        onSave(
                            cycle.copy(
                                name = cleanName(name),
                                targetLiters = target.toDouble(),
                                startMillis = start,
                                endMillis = if (cycle.isActive) null else end,
                                notes = notes.trim(),
                            )
                        )
                    }
                },
            ) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
