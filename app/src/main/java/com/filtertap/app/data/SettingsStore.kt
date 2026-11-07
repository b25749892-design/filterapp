package com.filtertap.app.data

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.filtertap.app.domain.MAX_LITERS
import com.filtertap.app.domain.MAX_QUICK_AMOUNTS
import com.filtertap.app.domain.MIN_LITERS
import com.filtertap.app.domain.Settings
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.settingsDataStore by preferencesDataStore(name = "settings")

private const val LIST_SEPARATOR = "\u001F"

class SettingsStore(private val context: Context) {

    private object Keys {
        val appName = stringPreferencesKey("app_name")
        val target = intPreferencesKey("default_target")
        val quick = stringPreferencesKey("quick_amounts")
        val haptics = booleanPreferencesKey("haptics")
        val people = stringPreferencesKey("people")
        val lastPerson = stringPreferencesKey("last_person")
    }

    val settings: Flow<Settings> = context.settingsDataStore.data.map { p ->
        val defaults = Settings()
        Settings(
            appName = p[Keys.appName]?.takeIf { it.isNotBlank() } ?: defaults.appName,
            defaultTargetLiters = p[Keys.target] ?: defaults.defaultTargetLiters,
            quickAmounts = p[Keys.quick]
                ?.split(',')
                ?.mapNotNull { it.toDoubleOrNull() }
                ?.filter { it in MIN_LITERS..MAX_LITERS }
                ?.distinct()
                ?.sorted()
                ?.take(MAX_QUICK_AMOUNTS)
                ?.takeIf { it.isNotEmpty() }
                ?: defaults.quickAmounts,
            hapticsEnabled = p[Keys.haptics] ?: defaults.hapticsEnabled,
            people = p[Keys.people]
                ?.split(LIST_SEPARATOR)
                ?.map { it.trim() }
                ?.filter { it.isNotEmpty() }
                ?.distinct()
                ?.takeIf { it.isNotEmpty() }
                ?: defaults.people,
            lastPerson = p[Keys.lastPerson]?.takeIf { it.isNotBlank() } ?: defaults.lastPerson,
        )
    }

    suspend fun write(settings: Settings) {
        context.settingsDataStore.edit { p: androidx.datastore.preferences.core.MutablePreferences ->
            p[Keys.appName] = settings.appName
            p[Keys.target] = settings.defaultTargetLiters
            p[Keys.quick] = settings.quickAmounts.joinToString(",")
            p[Keys.haptics] = settings.hapticsEnabled
            p[Keys.people] = settings.people.joinToString(LIST_SEPARATOR)
            p[Keys.lastPerson] = settings.lastPerson
        }
    }
}
