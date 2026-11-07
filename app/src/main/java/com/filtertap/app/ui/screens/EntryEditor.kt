package com.filtertap.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import com.filtertap.app.domain.Entry
import com.filtertap.app.domain.MAX_NOTE_LENGTH
import com.filtertap.app.domain.litersError
import com.filtertap.app.domain.noteError
import com.filtertap.app.domain.parseLiters
import com.filtertap.app.ui.fmtLitersInput
import com.filtertap.app.ui.components.ConfirmDialog
import com.filtertap.app.ui.components.DateTimeField
import com.filtertap.app.ui.nowMillis
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue

/** Adds a new entry (when [existing] is null) or edits one. Every field is validated before Save is enabled. */
@Composable
fun EntryEditor(
    existing: Entry?,
    people: List<String>,
    defaultPerson: String,
    initialLiters: Double?,
    onSave: (liters: Double, timestamp: Long, person: String, note: String) -> Unit,
    onDelete: (() -> Unit)?,
    onDismiss: () -> Unit,
) {
    var litersText by rememberSaveable {
        mutableStateOf(existing?.let { fmtLitersInput(it.liters) } ?: initialLiters?.let { fmtLitersInput(it) } ?: "")
    }
    var timestamp by rememberSaveable { mutableStateOf(existing?.timestampMillis ?: nowMillis()) }
    var person by rememberSaveable { mutableStateOf(existing?.person ?: defaultPerson) }
    var note by rememberSaveable { mutableStateOf(existing?.note ?: "") }
    var confirmDelete by remember { mutableStateOf(false) }

    val now = nowMillis()
    val litersProblem = litersError(litersText)
    val noteProblem = noteError(note)
    val timeProblem = if (timestamp > now + 60_000L) "Time can't be in the future" else null
    val canSave = litersProblem == null && noteProblem == null && timeProblem == null &&
        people.contains(person)

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (existing == null) "Add entry" else "Edit entry") },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                OutlinedTextField(
                    value = litersText,
                    onValueChange = { litersText = it },
                    label = { Text("Amount (L)") },
                    singleLine = true,
                    isError = litersText.isNotEmpty() && litersProblem != null,
                    supportingText = {
                        Text(
                            if (litersText.isNotEmpty() && litersProblem != null) litersProblem
                            else "Between 0.1 and 50 L"
                        )
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth(),
                )

                DateTimeField(
                    label = "When",
                    millis = timestamp,
                    onChange = { timestamp = it },
                    error = timeProblem,
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Person",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        people.forEach { name ->
                            FilterChip(
                                selected = name == person,
                                onClick = { person = name },
                                label = { Text(name) },
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text("Note (optional)") },
                    singleLine = true,
                    isError = noteProblem != null,
                    supportingText = {
                        Text(noteProblem ?: "${note.length}/$MAX_NOTE_LENGTH")
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            TextButton(
                enabled = canSave,
                onClick = {
                    parseLiters(litersText)?.let { liters ->
                        onSave(liters, timestamp, person, note.trim())
                    }
                },
            ) { Text("Save") }
        },
        dismissButton = {
            Row {
                if (onDelete != null) {
                    TextButton(onClick = { confirmDelete = true }) {
                        Text("Delete", color = MaterialTheme.colorScheme.error)
                    }
                }
                TextButton(onClick = onDismiss) { Text("Cancel") }
            }
        },
    )

    if (confirmDelete && onDelete != null) {
        ConfirmDialog(
            title = "Delete this entry?",
            text = "This can't be undone.",
            confirmLabel = "Delete",
            destructive = true,
            onConfirm = {
                confirmDelete = false
                onDelete()
            },
            onDismiss = { confirmDelete = false },
        )
    }
}
