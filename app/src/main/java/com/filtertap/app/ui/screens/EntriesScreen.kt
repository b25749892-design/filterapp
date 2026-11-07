package com.filtertap.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import com.filtertap.app.domain.Entry
import com.filtertap.app.ui.AppState
import com.filtertap.app.ui.components.EmptyHint
import com.filtertap.app.ui.components.EntryRow
import com.filtertap.app.ui.components.SectionLabel
import com.filtertap.app.ui.fmtAmount
import com.filtertap.app.ui.fmtDayHeader
import com.filtertap.app.ui.toLocalDate

/** Every entry, newest first, grouped by day. Tapping one opens the editor. */
@Composable
fun EntriesScreen(
    state: AppState,
    onOpen: (Entry) -> Unit,
    onAdd: () -> Unit,
) {
    val groups = state.entries
        .sortedByDescending { it.timestampMillis }
        .groupBy { it.timestampMillis.toLocalDate() }
        .toList()

    Box(modifier = Modifier.fillMaxSize()) {
        if (groups.isEmpty()) {
            Column(
                modifier = Modifier.fillMaxSize().statusBarsPadding().padding(20.dp),
            ) {
                Text(
                    text = "Entries",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                EmptyHint("No entries yet. Use the + button to add one.")
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().statusBarsPadding(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(
                    start = 20.dp, end = 20.dp, top = 20.dp, bottom = 104.dp,
                ),
            ) {
                item {
                    Text(
                        text = "Entries",
                        style = MaterialTheme.typography.headlineSmall,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(bottom = 12.dp),
                    )
                }
                groups.forEach { (day, rows) ->
                    item(key = "h-$day") {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(top = 12.dp, bottom = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            SectionLabel(fmtDayHeader(day))
                            SectionLabel(fmtAmount(rows.sumOf { it.liters }) + " L")
                        }
                    }
                    itemsIndexed(rows, key = { _, e -> e.id }) { index, entry ->
                        if (index > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                        EntryRow(entry, onClick = { onOpen(entry) })
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = onAdd,
            containerColor = MaterialTheme.colorScheme.primary,
            contentColor = MaterialTheme.colorScheme.onPrimary,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .navigationBarsPadding()
                .padding(20.dp),
        ) {
            Icon(Icons.Filled.Add, contentDescription = "Add entry")
        }
    }
}
