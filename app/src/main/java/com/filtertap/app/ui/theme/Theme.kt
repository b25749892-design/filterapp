package com.filtertap.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/*
 * Palette: a muted teal, a grey-blue secondary and a sage tertiary on near-white.
 * Chosen for low glare and calm contrast. Accents are used only for the
 * progress gauge, the primary action and the active state.
 */
private val LightColors = lightColorScheme(
    primary = Color(0xFF2F7F8C),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFD7EDF0),
    onPrimaryContainer = Color(0xFF0F3D44),
    secondary = Color(0xFF56757B),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFE2ECEE),
    onSecondaryContainer = Color(0xFF1B3A3F),
    tertiary = Color(0xFF5F8F76),
    onTertiary = Color(0xFFFFFFFF),
    tertiaryContainer = Color(0xFFDCEEE3),
    onTertiaryContainer = Color(0xFF173A28),
    background = Color(0xFFF6F8F8),
    onBackground = Color(0xFF1B2A2D),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF1B2A2D),
    surfaceVariant = Color(0xFFEDF2F2),
    onSurfaceVariant = Color(0xFF5A6E72),
    outline = Color(0xFFA9BABD),
    outlineVariant = Color(0xFFDDE6E7),
    error = Color(0xFFB4534A),
    onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFFF6DEDA),
    onErrorContainer = Color(0xFF5C1D17),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF8DCBD3),
    onPrimary = Color(0xFF0A2E34),
    primaryContainer = Color(0xFF1D4A51),
    onPrimaryContainer = Color(0xFFCFEBEE),
    secondary = Color(0xFFA9C2C7),
    onSecondary = Color(0xFF1B3136),
    secondaryContainer = Color(0xFF2B4248),
    onSecondaryContainer = Color(0xFFD7E6E9),
    tertiary = Color(0xFF9FCBB2),
    onTertiary = Color(0xFF12301F),
    tertiaryContainer = Color(0xFF254A37),
    onTertiaryContainer = Color(0xFFCDEBDA),
    background = Color(0xFF0E1719),
    onBackground = Color(0xFFE3EEEF),
    surface = Color(0xFF152023),
    onSurface = Color(0xFFE3EEEF),
    surfaceVariant = Color(0xFF1F2D30),
    onSurfaceVariant = Color(0xFFA7BABD),
    outline = Color(0xFF5E7377),
    outlineVariant = Color(0xFF2A3B3E),
    error = Color(0xFFF2A39A),
    onError = Color(0xFF4A150F),
    errorContainer = Color(0xFF6B2A23),
    onErrorContainer = Color(0xFFFBDCD8),
)

private val BaseType = Typography()

private val AppTypography = BaseType.copy(
    displaySmall = BaseType.displaySmall.copy(
        fontSize = 40.sp,
        lineHeight = 46.sp,
        fontWeight = FontWeight.SemiBold,
    ),
    headlineSmall = BaseType.headlineSmall.copy(fontWeight = FontWeight.SemiBold),
    titleMedium = BaseType.titleMedium.copy(fontWeight = FontWeight.SemiBold),
    titleSmall = BaseType.titleSmall.copy(fontWeight = FontWeight.SemiBold),
)

private val AppShapes = Shapes(
    small = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
    medium = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
    large = androidx.compose.foundation.shape.RoundedCornerShape(22.dp),
)

@Composable
fun FilterTapTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = AppTypography,
        shapes = AppShapes,
        content = content,
    )
}
