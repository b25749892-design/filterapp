package com.filtertap.app.data

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "cycles")
data class CycleEntity(
    @PrimaryKey val id: String,
    val name: String,
    val startMillis: Long,
    val endMillis: Long?,
    val targetLiters: Double,
    val notes: String,
    val resetReason: String,
)

@Entity(
    tableName = "entries",
    indices = [Index("cycleId"), Index("timestampMillis")],
)
data class EntryEntity(
    @PrimaryKey val id: String,
    val cycleId: String,
    val timestampMillis: Long,
    val liters: Double,
    val person: String,
    val note: String,
    val source: String,
    val createdAtMillis: Long,
    val updatedAtMillis: Long,
)

@Dao
interface FilterDao {
    @Query("SELECT * FROM cycles ORDER BY startMillis DESC")
    fun observeCycles(): Flow<List<CycleEntity>>

    @Query("SELECT * FROM cycles ORDER BY startMillis DESC")
    suspend fun cycles(): List<CycleEntity>

    @Query("SELECT * FROM entries ORDER BY timestampMillis DESC")
    fun observeEntries(): Flow<List<EntryEntity>>

    @Query("SELECT * FROM entries ORDER BY timestampMillis DESC")
    suspend fun entries(): List<EntryEntity>

    @Query("SELECT * FROM entries WHERE id = :id")
    suspend fun entry(id: String): EntryEntity?

    @Upsert
    suspend fun upsertCycle(cycle: CycleEntity)

    @Upsert
    suspend fun upsertCycles(cycles: List<CycleEntity>)

    @Upsert
    suspend fun upsertEntry(entry: EntryEntity)

    @Upsert
    suspend fun upsertEntries(entries: List<EntryEntity>)

    @Query("DELETE FROM entries WHERE id = :id")
    suspend fun deleteEntry(id: String)

    @Query("DELETE FROM entries")
    suspend fun clearEntries()

    @Query("DELETE FROM cycles")
    suspend fun clearCycles()
}

@Database(
    entities = [CycleEntity::class, EntryEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class FilterDatabase : RoomDatabase() {
    abstract fun dao(): FilterDao

    companion object {
        fun create(context: Context): FilterDatabase =
            Room.databaseBuilder(context, FilterDatabase::class.java, "filtertap.db").build()
    }
}
