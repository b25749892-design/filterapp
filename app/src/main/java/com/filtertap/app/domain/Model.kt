package com.filtertap.app.domain

import java.util.UUID

const val SOURCE_QUICK = "quick_tap"
const val SOURCE_MANUAL = "manual_entry"
const val SOURCE_RETRO = "retroactive"

const val MIN_LITERS = 0.1
const val MAX_LITERS = 50.0
const val MIN_TARGET = 100
const val MAX_TARGET = 10_000
const val MAX_NAME_LENGTH = 24
const val MAX_CYCLE_NAME_LENGTH = 40
const val MAX_NOTE_LENGTH = 80
const val MAX_STATION_NAME_LENGTH = 30
const val MAX_QUICK_AMOUNTS = 4

val QUICK_AMOUNT_CHOICES = listOf(1.0, 2.0, 5.0, 10.0, 20.0)

/** One physical filter, from installation (or replacement) until it is replaced. */
data class Cycle(
    val id: String,
    val name: String,
    val startMillis: Long,
    /** Null while this is the filter in use. */
    val endMillis: Long?,
    val targetLiters: Double,
    val notes: String = "",
    val resetReason: String = "",
) {
    val isActive: Boolean get() = endMillis == null
}

/** One logged fill. The filter it belongs to is derived from [timestampMillis]. */
data class Entry(
    val id: String,
    val cycleId: String,
    val timestampMillis: Long,
    val liters: Double,
    val person: String,
    val note: String,
    val source: String,
    val createdAtMillis: Long,
    val updatedAtMillis: Long,
)

data class Settings(
    val appName: String = "FilterTap",
    val defaultTargetLiters: Int = 1500,
    val quickAmounts: List<Double> = listOf(1.0, 2.0, 5.0, 10.0),
    val hapticsEnabled: Boolean = true,
    val people: List<String> = listOf("Me"),
    val lastPerson: String = "Me",
)

fun newId(): String = UUID.randomUUID().toString()
