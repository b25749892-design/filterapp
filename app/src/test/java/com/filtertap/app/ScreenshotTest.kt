package com.filtertap.app

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
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

/**
 * Renders the real screens with fixed sample data. Run `./gradlew recordPaparazziDebug`
 * to write PNGs to app/src/test/snapshots/images. The screenshots workflow copies them to docs/screenshots.
 */
class ScreenshotTest {

    @get:Rule
    val phone = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @get:Rule
    val tablet = Paparazzi(deviceConfig = DeviceConfig.PIXEL_TABLET)

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

    private fun shot(paparazzi: Paparazzi, name: String, content: @Composable () -> Unit) {
        paparazzi.snapshot(name = name) {
            FilterTapTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    content()
                }
            }
        }
    }

    @Test fun tracker() = shot(phone, "tracker") {
        TrackerScreen(sample, {}, {}, {}, {}, {}, {})
    }

    @Test fun entries() = shot(phone, "entries") {
        EntriesScreen(sample, {}, {})
    }

    @Test fun filters() = shot(phone, "filters") {
        FiltersScreen(sample, {}, { _, _, _, _ -> })
    }

    @Test fun settings() = shot(phone, "settings") {
        SettingsScreen(sample, {}, {}, {}, {}, {}, { _, _ -> }, {}, {}, {}, {}, {})
    }

    @Test fun tracker_tablet() = shot(tablet, "tracker_tablet") {
        TrackerScreen(sample, {}, {}, {}, {}, {}, {})
    }
}
