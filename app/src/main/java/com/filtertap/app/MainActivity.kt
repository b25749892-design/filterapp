package com.filtertap.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import com.filtertap.app.ui.AppViewModel
import com.filtertap.app.ui.FilterTapRoot
import com.filtertap.app.ui.theme.FilterTapTheme

class MainActivity : ComponentActivity() {

    private val viewModel: AppViewModel by viewModels {
        AppViewModel.Factory(application, (application as FilterTapApp).repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            FilterTapTheme {
                FilterTapRoot(viewModel)
            }
        }
    }
}
