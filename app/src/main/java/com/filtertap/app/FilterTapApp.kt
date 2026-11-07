package com.filtertap.app

import android.app.Application
import com.filtertap.app.data.FilterDatabase
import com.filtertap.app.data.FilterRepository
import com.filtertap.app.data.SettingsStore

class FilterTapApp : Application() {
    val repository: FilterRepository by lazy {
        FilterRepository(FilterDatabase.create(this), SettingsStore(this))
    }
}
