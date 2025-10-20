# Room Creation - Soft Delete Fix ✅

## Problem
When trying to create a room that was previously soft-deleted, the API threw a unique constraint error:
```
Unique constraint failed on the constraint: `unique_pg_room`
```

This happened because the `unique_pg_room` constraint on `[pg_id, room_no]` includes soft-deleted records.

---

## Solution
Modified the `create` method in `RoomService` to check for soft-deleted rooms and restore them instead of creating new ones.

---

## Implementation

### **Before:**
```typescript
async create(createRoomDto: CreateRoomDto) {
  const room = await this.prisma.rooms.create({
    data: {
      pg_id: createRoomDto.pg_id,
      room_no: createRoomDto.room_no,
      rent_price: createRoomDto.rent_price,
      images: createRoomDto.images,
    },
  });
  // ❌ Fails if soft-deleted room exists
}
```

### **After:**
```typescript
async create(createRoomDto: CreateRoomDto) {
  // 1. Check for soft-deleted room
  const existingDeletedRoom = await this.prisma.rooms.findFirst({
    where: {
      pg_id: createRoomDto.pg_id,
      room_no: createRoomDto.room_no,
      is_deleted: true,
    },
  });

  if (existingDeletedRoom) {
    // 2. Restore soft-deleted room
    room = await this.prisma.rooms.update({
      where: { s_no: existingDeletedRoom.s_no },
      data: {
        is_deleted: false,
        rent_price: createRoomDto.rent_price,
        images: createRoomDto.images,
        updated_at: new Date(),
      },
    });
    return { message: 'Room restored successfully' };
  } else {
    // 3. Create new room
    room = await this.prisma.rooms.create({
      data: { ... },
    });
    return { message: 'Room created successfully' };
  }
}
```

---

## Flow Diagram

```
User creates room with room_no "101"
           ↓
Check: Does deleted room exist?
           ↓
    ┌──────┴──────┐
    │             │
   YES           NO
    │             │
    ↓             ↓
Restore      Create New
(UPDATE)      (INSERT)
    │             │
    └──────┬──────┘
           ↓
    Return Success
```

---

## Benefits

✅ **No unique constraint errors** - Handles soft-deleted rooms  
✅ **Data preservation** - Restores existing room with same ID  
✅ **Bed relationships preserved** - Existing beds remain linked  
✅ **Clean user experience** - User can recreate deleted rooms  
✅ **Audit trail maintained** - Original creation date preserved  

---

## Database Constraint

```prisma
model rooms {
  s_no       Int     @id @default(autoincrement())
  pg_id      Int?
  room_no    String? @db.VarChar(20)
  is_deleted Boolean? @default(false)
  
  @@unique([pg_id, room_no], map: "unique_pg_room")
}
```

The `unique_pg_room` constraint ensures:
- One room number per PG location
- Includes both active AND deleted rooms
- Prevents duplicate room numbers

---

## Testing Scenarios

### **Scenario 1: Create New Room**
```
Input: Room 101 (doesn't exist)
Result: ✅ Creates new room
Message: "Room created successfully"
```

### **Scenario 2: Restore Deleted Room**
```
Input: Room 101 (soft-deleted)
Result: ✅ Restores existing room
Message: "Room restored successfully"
Updates: is_deleted = false, rent_price, images
```

### **Scenario 3: Duplicate Active Room**
```
Input: Room 101 (already active)
Result: ❌ Unique constraint error
(This is expected - can't have duplicate active rooms)
```

---

## Related Changes Needed

Consider applying the same pattern to:
- ✅ **Bed creation** - Same soft-delete issue
- ✅ **Tenant creation** - If using unique constraints
- ✅ **PG Location creation** - If using unique constraints

---

## Result

✅ **Room creation now handles soft-deleted rooms**  
✅ **No more unique constraint errors**  
✅ **Seamless restore functionality**  
✅ **Better user experience**  

**Users can now recreate previously deleted rooms without errors!** 🎉
