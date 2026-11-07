package com.filtertap.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.dp
import com.filtertap.app.domain.Entry
import com.filtertap.app.domain.cycleStats
import com.filtertap.app.ui.AppState
import com.filtertap.app.ui.components.DropTile
import com.filtertap.app.ui.components.EmptyHint
import com.filtertap.app.ui.components.EntryRow
import com.filtertap.app.ui.components.Gauge
import com.filtertap.app.ui.components.PersonChips
import com.filtertap.app.ui.components.SectionLabel
import com.filtertap.app.ui.components.StatBlock
import com.filtertap.app.ui.components.StatusPill
import com.filtertap.app.ui.components.TextPromptDialog
import com.filtertap.app.ui.components.WaveLine
import com.filtertap.app.ui.components.rememberTap
import com.filtertap.app.domain.nameError
import com.filtertap.app.ui.fmtAmount
import com.filtertap.app.ui.fmtLiters
import com.filtertap.app.ui.nowMillis
import com.filtertap.app.ui.toLocalDate
import com.filtertap.app.ui.zone
import java.time.LocalDate

@Composable
fun TrackerScreen(
    state: AppState,
    onLogQuick: (Double) -> Unit,
    onOtherAmount: () -> Unit,
    onSelectPerson: (String) -> Unit,
    onAddPerson: (String) -> Unit,
    onOpenEntry: (Entry) -> Unit,
    onOpenEntries: () -> Unit,
) {
    val active = state.active
    val tap = rememberTap(state.settings.hapticsEnabled)
    var addingPerson by remember { mutableStateOf(false) }

    if (active == null) {
        EmptyHint("Preparing your filter…")
        return
    }

    val now = nowMillis()
    val stats = cycleStats(active, state.entries, now)
    val todayEntries = state.activeEntries.filter { it.timestampMillis.toLocalDate() == LocalDate.now(zone) }
    val todayTotal = todayEntries.sumOf { it.liters }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(top = 20.dp, bottom = 32.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        Column {
            Text(
                text = state.settings.appName,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = active.name,
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface,
            )
            WaveLine(modifier = Modifier.padding(top = 4.dp))
        }

        // Gradient card: the gauge sits on a soft teal wash.
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(MaterialTheme.shapes.large)
                .background(
                    Brush.verticalGradient(
                        listOf(MaterialTheme.colorScheme.primaryContainer, MaterialTheme.colorScheme.surface),
                    ),
                )
                .padding(horizontal = 20.dp, vertical = 24.dp),
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(20.dp),
            ) {
                Gauge(
                    fraction = stats.fraction,
                    centerValue = fmtAmount(stats.used) + " L",
                    centerCaption = "of ${fmtAmount(stats.target)} L used",
                )
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    StatBlock("Remaining", fmtLiters(stats.remaining))
                    StatBlock(
                        "Per day",
                        if (stats.dailyAverage > 0) fmtLiters(stats.dailyAverage) else "—",
                    )
                    StatBlock(
                        "Replace in",
                        stats.daysLeft?.let { "$it day" + if (it == 1) "" else "s" } ?: "—",
                    )
                }
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            SectionLabel("Who is filling?")
            PersonChips(
                people = state.settings.people,
                selected = state.settings.lastPerson,
                onSelect = onSelectPerson,
                onAdd = { addingPerson = true },
            )
        }

        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            SectionLabel("Log a fill")
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                state.settings.quickAmounts.forEach { amount ->
                    DropTile(
                        label = fmtAmount(amount) + " L",
                        onClick = {
                            tap()
                            onLogQuick(amount)
                        },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
            OutlinedButton(onClick = onOtherAmount, modifier = Modifier.fillMaxWidth()) {
                Text("Other amount")
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                SectionLabel("Today")
                if (todayEntries.isNotEmpty()) {
                    StatusPill(fmtLiters(todayTotal), emphasized = false)
                }
            }
            if (todayEntries.isEmpty()) {
                EmptyHint("Nothing logged today yet.")
            } else {
                todayEntries.sortedByDescending { it.timestampMillis }.take(5).forEachIndexed { index, entry ->
                    if (index > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    EntryRow(entry, onClick = { onOpenEntry(entry) })
                }
                if (todayEntries.size > 5) {
                    OutlinedButton(onClick = onOpenEntries, modifier = Modifier.fillMaxWidth()) {
                        Text("See all entries")
                    }
                }
            }
        }
    }

    if (addingPerson) {
        TextPromptDialog(
            title = "Add a person",
            label = "Name",
            initial = "",
            confirmLabel = "Add",
            validate = { nameError(it, state.settings.people) },
            onConfirm = {
                addingPerson = false
                onAddPerson(it)
            },
            onDismiss = { addingPerson = false },
        )
    }
}
