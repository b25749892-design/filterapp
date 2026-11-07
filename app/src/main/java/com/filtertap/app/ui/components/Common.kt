package com.filtertap.app.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.GenericShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.filtertap.app.domain.Entry
import com.filtertap.app.ui.fmtAmount
import com.filtertap.app.ui.fmtTime
import kotlin.math.PI
import kotlin.math.sin

@Composable
fun SurfaceCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            content = content,
        )
    }
}

@Composable
fun SectionLabel(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
}

@Composable
fun StatBlock(label: String, value: String, modifier: Modifier = Modifier) {
    Column(modifier = modifier) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

@Composable
fun StatusPill(text: String, emphasized: Boolean) {
    val container = if (emphasized) MaterialTheme.colorScheme.primaryContainer
    else MaterialTheme.colorScheme.surfaceVariant
    val content = if (emphasized) MaterialTheme.colorScheme.onPrimaryContainer
    else MaterialTheme.colorScheme.onSurfaceVariant
    Box(
        modifier = Modifier
            .background(container, RoundedCornerShape(50))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    ) {
        Text(text = text, style = MaterialTheme.typography.labelMedium, color = content)
    }
}

/* ---------- Drop shape: the app's recurring motif ---------- */

/** A water drop with its point at the top, fitted to a w x h box. */
fun dropPath(w: Float, h: Float): Path = Path().apply {
    moveTo(w * 0.5f, 0f)
    cubicTo(w * 0.5f, h * 0.12f, w * 0.05f, h * 0.42f, w * 0.05f, h * 0.68f)
    cubicTo(w * 0.05f, h * 0.88f, w * 0.25f, h, w * 0.5f, h)
    cubicTo(w * 0.75f, h, w * 0.95f, h * 0.88f, w * 0.95f, h * 0.68f)
    cubicTo(w * 0.95f, h * 0.42f, w * 0.5f, h * 0.12f, w * 0.5f, 0f)
    close()
}

private val DropShape: Shape = GenericShape { size, _ ->
    addPath(dropPath(size.width, size.height))
}

/** Outline of a drop with a small waterline, used for empty states. */
@Composable
fun DropOutline(modifier: Modifier = Modifier) {
    val color = MaterialTheme.colorScheme.outline
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        drawPath(
            path = dropPath(w, h),
            color = color,
            style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round),
        )
        val line = Path().apply {
            moveTo(w * 0.28f, h * 0.62f)
            quadraticBezierTo(w * 0.5f, h * 0.55f, w * 0.72f, h * 0.62f)
        }
        drawPath(line, color, style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round))
    }
}

/** A quick-fill tile shaped like a drop. */
@Composable
fun DropTile(label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .height(84.dp)
            .clip(DropShape)
            .background(MaterialTheme.colorScheme.primaryContainer)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onPrimaryContainer,
        )
    }
}

@Composable
fun EmptyHint(text: String) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(vertical = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        DropOutline(modifier = Modifier.size(34.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

/* ---------- Liquid gauge ---------- */

private fun DrawScope.drawWave(surfaceY: Float, amplitude: Float, phase: Float, color: Color) {
    val wavelength = size.width
    val path = Path()
    path.moveTo(0f, surfaceY + amplitude * sin(phase))
    var x = 0f
    while (x <= size.width) {
        path.lineTo(x, surfaceY + amplitude * sin(x / wavelength * 2f * PI.toFloat() + phase))
        x += 4f
    }
    path.lineTo(size.width, size.height)
    path.lineTo(0f, size.height)
    path.close()
    drawPath(path, color)
}

/**
 * Circular gauge filled like water. The surface rises with usage and gently waves.
 * Level 0 is empty, 1 is full.
 */
@Composable
fun Gauge(
    fraction: Float,
    centerValue: String,
    centerCaption: String,
    modifier: Modifier = Modifier,
) {
    val level by animateFloatAsState(
        targetValue = fraction,
        animationSpec = tween(durationMillis = 900),
        label = "level",
    )
    val phase by rememberInfiniteTransition(label = "wave").animateFloat(
        initialValue = 0f,
        targetValue = (2 * PI).toFloat(),
        animationSpec = infiniteRepeatable(animation = tween(durationMillis = 2800, easing = LinearEasing)),
        label = "phase",
    )
    val ring = MaterialTheme.colorScheme.outlineVariant
    val track = MaterialTheme.colorScheme.surfaceVariant
    val water = MaterialTheme.colorScheme.primary
    val waterBack = MaterialTheme.colorScheme.primary.copy(alpha = 0.35f)

    Box(modifier = modifier.size(208.dp), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val stroke = 6.dp.toPx()
            val radius = size.minDimension / 2f - stroke / 2f
            val center = Offset(size.width / 2f, size.height / 2f)

            drawCircle(color = track, radius = radius, center = center)

            val disc = Path().apply { addOval(Rect(center, radius)) }
            clipPath(disc) {
                val surfaceY = center.y + radius - level * 2f * radius
                drawWave(surfaceY, amplitude = 5.dp.toPx(), phase = phase + PI.toFloat(), color = waterBack)
                drawWave(surfaceY, amplitude = 7.dp.toPx(), phase = phase, color = water)
            }

            drawCircle(color = ring, radius = radius, center = center, style = Stroke(width = stroke))
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = centerValue,
                style = MaterialTheme.typography.displaySmall,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Text(
                text = centerCaption,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/** A thin decorative wave used under headers. */
@Composable
fun WaveLine(modifier: Modifier = Modifier) {
    val color = MaterialTheme.colorScheme.primary.copy(alpha = 0.35f)
    Canvas(modifier = modifier.fillMaxWidth().height(16.dp)) {
        val mid = size.height / 2f
        val amp = 4.dp.toPx()
        val wavelength = 64.dp.toPx()
        val path = Path()
        path.moveTo(0f, mid)
        var x = 0f
        while (x <= size.width) {
            path.lineTo(x, mid + amp * sin(x / wavelength * 2f * PI.toFloat()))
            x += 4f
        }
        drawPath(path, color, style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round))
    }
}

@Composable
fun PersonChips(
    people: List<String>,
    selected: String,
    onSelect: (String) -> Unit,
    onAdd: () -> Unit,
) {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items(people) { name ->
            FilterChip(
                selected = name == selected,
                onClick = { onSelect(name) },
                label = { Text(name) },
            )
        }
        item {
            AssistChip(
                onClick = onAdd,
                label = { Text("Add") },
                leadingIcon = { Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp)) },
            )
        }
    }
}

/** A single logged fill. Tapping it opens the editor when [onClick] is given. */
@Composable
fun EntryRow(entry: Entry, onClick: (() -> Unit)? = null) {
    val rowModifier = Modifier
        .fillMaxWidth()
        .let { if (onClick != null) it.clickable(onClick = onClick) else it }
        .padding(vertical = 10.dp)
    Row(modifier = rowModifier, verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = fmtTime(entry.timestampMillis),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.width(78.dp),
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = entry.person,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface,
            )
            if (entry.note.isNotBlank()) {
                Text(
                    text = entry.note,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
        Text(
            text = "${fmtAmount(entry.liters)} L",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

/** Returns a function that gives a light haptic tick, if haptics are enabled. */
@Composable
fun rememberTap(enabled: Boolean): () -> Unit {
    val haptics = LocalHapticFeedback.current
    return remember(enabled, haptics) {
        {
            if (enabled) haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
        }
    }
}
