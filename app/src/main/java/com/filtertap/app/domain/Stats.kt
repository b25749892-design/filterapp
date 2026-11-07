package com.filtertap.app.domain

import kotlin.math.ceil
import kotlin.math.max

const val DAY_MS = 86_400_000L

data class CycleStats(
    val used: Double,
    val target: Double,
    val remaining: Double,
    /** 0..1, clamped. */
    val fraction: Float,
    val dailyAverage: Double,
    /** Null when there is not enough data to estimate. */
    val daysLeft: Int?,
)

/**
 * Finds the filter that was in use at [timestamp]. Times before the first filter
 * belong to the first filter; times after the active filter's start belong to it.
 */
fun cycleFor(timestamp: Long, cycles: List<Cycle>): Cycle? {
    cycles.firstOrNull { timestamp >= it.startMillis && (it.endMillis == null || timestamp < it.endMillis) }
        ?.let { return it }
    val earliest = cycles.minByOrNull { it.startMillis }
    return if (earliest != null && timestamp < earliest.startMillis) earliest
    else cycles.firstOrNull { it.isActive }
}

fun cycleStats(cycle: Cycle, entries: List<Entry>, now: Long): CycleStats {
    val used = entries.filter { it.cycleId == cycle.id }.sumOf { it.liters }
    val end = cycle.endMillis ?: now
    // At least one day, so a brand-new filter does not produce an absurd daily rate.
    val days = max(1.0, (end - cycle.startMillis).toDouble() / DAY_MS)
    val average = used / days
    val remaining = max(0.0, cycle.targetLiters - used)
    val daysLeft = if (cycle.isActive && average > 0 && remaining > 0) {
        ceil(remaining / average).toInt()
    } else {
        null
    }
    return CycleStats(
        used = used,
        target = cycle.targetLiters,
        remaining = remaining,
        fraction = (used / cycle.targetLiters).coerceIn(0.0, 1.0).toFloat(),
        dailyAverage = average,
        daysLeft = daysLeft,
    )
}
