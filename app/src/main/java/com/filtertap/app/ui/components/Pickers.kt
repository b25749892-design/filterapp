@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.filtertap.app.ui.components

import android.text.format.DateFormat
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SelectableDates
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import com.filtertap.app.ui.fmtDate
import com.filtertap.app.ui.fmtTime
import com.filtertap.app.ui.toLocalDate
import com.filtertap.app.ui.toUtcMillis
import com.filtertap.app.ui.utcMidnightToLocalDate
import com.filtertap.app.ui.zone
import java.time.Instant
import java.time.LocalDate
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue

/** Date picker that refuses days after today. */
private val NoFutureDates = object : SelectableDates {
    override fun isSelectableDate(utcTimeMillis: Long): Boolean =
        utcTimeMillis <= LocalDate.now(zone).toUtcMillis()
}

/**
 * A read-only field that opens a date picker, then a time picker.
 * Reports the result as epoch millis in the device time zone.
 */
@Composable
fun DateTimeField(
    label: String,
    millis: Long,
    onChange: (Long) -> Unit,
    error: String? = null,
) {
    var step by remember { mutableIntStateOf(0) }
    var pickedDay by remember { mutableLongStateOf(0L) }

    Box {
        OutlinedTextField(
            value = "${fmtDate(millis)}  ·  ${fmtTime(millis)}",
            onValueChange = {},
            readOnly = true,
            singleLine = true,
            label = { Text(label) },
            isError = error != null,
            supportingText = { if (error != null) Text(error) },
            modifier = Modifier.fillMaxWidth(),
        )
        Box(Modifier.matchParentSize().clickable { step = 1 })
    }

    if (step == 1) {
        val state = rememberDatePickerState(
            initialSelectedDateMillis = millis.toLocalDate().toUtcMillis(),
            selectableDates = NoFutureDates,
        )
        DatePickerDialog(
            onDismissRequest = { step = 0 },
            confirmButton = {
                TextButton(onClick = {
                    val chosen = state.selectedDateMillis
                    if (chosen != null) {
                        pickedDay = chosen
                        step = 2
                    } else {
                        step = 0
                    }
                }) { Text("Next") }
            },
            dismissButton = { TextButton(onClick = { step = 0 }) { Text("Cancel") } },
        ) {
            DatePicker(state = state)
        }
    }

    if (step == 2) {
        val local = Instant.ofEpochMilli(millis).atZone(zone)
        val timeState = rememberTimePickerState(
            initialHour = local.hour,
            initialMinute = local.minute,
            is24Hour = DateFormat.is24HourFormat(LocalContext.current),
        )
        AlertDialog(
            onDismissRequest = { step = 0 },
            title = { Text("Time") },
            text = { TimePicker(state = timeState) },
            confirmButton = {
                TextButton(onClick = {
                    val day = pickedDay.utcMidnightToLocalDate()
                    val result = day.atTime(timeState.hour, timeState.minute)
                        .atZone(zone)
                        .toInstant()
                        .toEpochMilli()
                    onChange(result)
                    step = 0
                }) { Text("Set") }
            },
            dismissButton = { TextButton(onClick = { step = 0 }) { Text("Cancel") } },
        )
    }
}

/** A single text input in a dialog, with live validation. */
@Composable
fun TextPromptDialog(
    title: String,
    label: String,
    initial: String,
    confirmLabel: String,
    validate: (String) -> String?,
    onConfirm: (String) -> Unit,
    onDismiss: () -> Unit,
    keyboard: KeyboardType = KeyboardType.Text,
) {
    var value by rememberSaveable { mutableStateOf(initial) }
    val problem = validate(value)

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            OutlinedTextField(
                value = value,
                onValueChange = { value = it },
                label = { Text(label) },
                singleLine = true,
                isError = problem != null && value.isNotEmpty(),
                supportingText = { if (problem != null && value.isNotEmpty()) Text(problem) },
                keyboardOptions = KeyboardOptions(keyboardType = keyboard),
                modifier = Modifier.fillMaxWidth(),
            )
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(value.trim()) }, enabled = problem == null) {
                Text(confirmLabel)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

@Composable
fun ConfirmDialog(
    title: String,
    text: String,
    confirmLabel: String,
    destructive: Boolean = false,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { Text(text) },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text(
                    confirmLabel,
                    color = if (destructive) androidx.compose.material3.MaterialTheme.colorScheme.error
                    else androidx.compose.material3.MaterialTheme.colorScheme.primary,
                )
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
