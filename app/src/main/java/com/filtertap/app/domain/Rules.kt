package com.filtertap.app.domain

import kotlin.math.abs
import kotlin.math.roundToLong

/**
 * Input rules shared by every form. Keeping them here means the same mistake
 * is caught the same way everywhere.
 */

/** Parses an amount in liters. Accepts "1,5" and "1.5". Returns null when invalid. */
fun parseLiters(text: String): Double? {
    val value = text.trim().replace(',', '.').toDoubleOrNull() ?: return null
    if (value < MIN_LITERS || value > MAX_LITERS) return null
    val tenths = value * 10
    if (abs(tenths - tenths.roundToLong()) > 1e-6) return null
    return tenths.roundToLong() / 10.0
}

fun litersError(text: String): String? = when {
    text.isBlank() -> "Enter an amount"
    parseLiters(text) == null -> "Use $MIN_LITERS to $MAX_LITERS L, with at most one decimal"
    else -> null
}

fun parseTarget(text: String): Int? =
    text.trim().toIntOrNull()?.takeIf { it in MIN_TARGET..MAX_TARGET }

fun targetError(text: String): String? = when {
    text.isBlank() -> "Enter a capacity"
    parseTarget(text) == null -> "Use a whole number from $MIN_TARGET to $MAX_TARGET"
    else -> null
}

/** Collapses whitespace and trims. Use before storing any name. */
fun cleanName(raw: String): String = raw.trim().replace(Regex("\\s+"), " ")

fun nameError(
    name: String,
    taken: List<String>,
    current: String? = null,
    max: Int = MAX_NAME_LENGTH,
): String? {
    val cleaned = cleanName(name)
    return when {
        cleaned.isEmpty() -> "Enter a name"
        cleaned.length > max -> "Keep it under $max characters"
        taken.any { it.equals(cleaned, ignoreCase = true) && !it.equals(current, ignoreCase = true) } ->
            "\u201C$cleaned\u201D is already in the list"
        else -> null
    }
}

fun noteError(note: String): String? =
    if (note.length > MAX_NOTE_LENGTH) "Keep it under $MAX_NOTE_LENGTH characters" else null
