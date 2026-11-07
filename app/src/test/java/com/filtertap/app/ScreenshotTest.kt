package com.filtertap.app

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import com.github.takahirom.roborazzi.captureRoboImage
import com.filtertap.app.domain.Cycle
import com.filtertap.app.domain.Entry
import com.filtertap.app.domain.Settings
import com.filtertap.app.domain.SOURCE_MANUAL
import com.filtertap.app.domain.SOURCE_QUICK
import com.filtertap.app.ui.AppState
import com.filtertap.app.ui.screens.EntriesScreen
import com.filtertap.app.ui.screens.FiltersScreen
import com.filtertap.app.ui.screens.SettingsScreen
import com.filtertap.app.ui.screens.TrackerScreen
import com.filtertap.app.ui.theme.FilterTapTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * Renders the real screens with sample data and writes PNGs to docs/screenshots.
 * Run with: ./gradlew recordRoborazziDebug
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScreenshotTest {

    @get:Rule
    val rule = createComposeRule()

    private val day = 86_400_000L
    private val now = System.currentTimeMillis()

    private val sample = AppState(
        loaded = true,
        settings = Settings(
            appName = "Kitchen",
            defaultTargetLiters = 1500,
            quickAmounts = listOf(1.0, 2.0, 5.0, 10.0),
            people = listOf("Me", "Sam"),
            lastPerson = "Me",
        ),
        cycles = listOf(
            Cycle("c2", "Filter #2", now - 20 * day, null, 1500.0),
            Cycle("c1", "Filter #1", now - 60 * day, now - 20 * day, 1500.0, resetReason = "Scheduled"),
        ),
        entries = listOf(
            Entry("e1", "c2", now - 2_000_000, 2.0, "Me", "", SOURCE_QUICK, now, now),
            Entry("e2", "c2", now - 9_000_000, 5.0, "Sam", "Big pot", SOURCE_MANUAL, now, now),
            Entry("e3", "c2", now - day, 10.0, "Me", "", SOURCE_QUICK, now, now),
            Entry("e4", "c2", now - 2 * day, 1.0, "Sam", "", SOURCE_QUICK, now, now),
            Entry("e5", "c1", now - 30 * day, 20.0, "Me", "", SOURCE_QUICK, now, now),
        ),
    )

    private fun shot(path: String, content: @Composable () -> Unit) {
        rule.setContent {
            FilterTapTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    content()
                }
            }
        }
        rule.onRoot().captureRoboImage("../docs/screenshots/$path.png")
    }

    @Config(qualifiers = "w411dp-h891dp-xxhdpi")
    @Test fun tracker() = shot("tracker") {
        TrackerScreen(sample, {}, {}, {}, {}, {}, {})
    }

    @Config(qualifiers = "w411dp-h891dp-xxhdpi")
    @Test fun entries() = shot("entries") {
        EntriesScreen(sample, {}, {})
    }

    @Config(qualifiers = "w411dp-h891dp-xxhdpi")
    @Test fun filters() = shot("filters") {
        FiltersScreen(sample, {}, { _, _, _, _ -> })
    }

    @Config(qualifiers = "w411dp-h891dp-xxhdpi")
    @Test fun settings() = shot("settings") {
        SettingsScreen(sample, {}, {}, {}, {}, {}, { _, _ -> }, {}, {}, {}, {}, {})
    }

    @Config(qualifiers = "w1280dp-h800dp-xhdpi")
    @Test fun tracker_tablet() = shot("tracker_tablet") {
        TrackerScreen(sample, {}, {}, {}, {}, {}, {})
    }
}
