package com.filtertap.app.ui

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.Locale

val zone: ZoneId = ZoneId.systemDefault()

fun nowMillis(): Long = System.currentTimeMillis()

fun Long.toLocalDate(): LocalDate = Instant.ofEpochMilli(this).atZone(zone).toLocalDate()

/** Date pickers report the chosen day as UTC midnight. */
fun LocalDate.toUtcMillis(): Long = atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()

fun Long.utcMidnightToLocalDate(): LocalDate =
    Instant.ofEpochMilli(this).atZone(ZoneOffset.UTC).toLocalDate()

fun fmtAmount(value: Double): String =
    if (value % 1.0 == 0.0) "%,d".format(value.toLong()) else "%,.1f".format(value)

fun fmtLiters(value: Double): String = fmtAmount(value) + " L"

/** Plain number for text fields, for example "5" or "2.5". */
fun fmtLitersInput(value: Double): String =
    if (value % 1.0 == 0.0) value.toLong().toString() else value.toString()

fun fmtDate(millis: Long): String =
    millis.toLocalDate().format(DateTimeFormatter.ofPattern("d MMM yyyy", Locale.getDefault()))

fun fmtTime(millis: Long): String =
    Instant.ofEpochMilli(millis).atZone(zone)
        .format(DateTimeFormatter.ofPattern("h:mm a", Locale.getDefault()))

fun fmtDayHeader(day: LocalDate): String {
    val today = LocalDate.now(zone)
    return when (day) {
        today -> "Today"
        today.minusDays(1) -> "Yesterday"
        else -> day.format(DateTimeFormatter.ofPattern("EEEE, d MMM", Locale.getDefault()))
    }
}
