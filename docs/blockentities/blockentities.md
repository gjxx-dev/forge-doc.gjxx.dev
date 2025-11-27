# 方块实体（BlockEntities）
`BlockEntities` 类似于绑定到方块的简化 `Entities`。它们用于存储动态数据、执行基于刻（tick）的任务以及支持动态渲染。原版示例包括箱子的物品栏处理、熔炉的冶炼逻辑或信标的区域效果。模组中还有更多高级示例，例如采石机、分拣机、管道与显示器等。

!!! note
    `BlockEntities` 并非万灵药，错误使用会导致性能问题。请在可能时尽量避免不必要的 BlockEntity。

## 注册

Block Entities 是动态创建与销毁的，因此它们本身不是独立的注册对象。

要创建一个 `BlockEntity`，需要继承 `BlockEntity` 类。因此通常还需注册另一个对象以便创建与引用这种动态对象的*类型*。对于 `BlockEntity`，这类对象称为 `BlockEntityType`。

`BlockEntityType` 可以像其他注册对象一样被[注册][registration]。`BlockEntityType` 的构造函数接收两个参数：一个 `BlockEntityType$BlockEntitySupplier`（接收 `BlockPos` 与 `BlockState` 并创建对应的 `BlockEntity` 实例），以及一个 `Set<Block>`，表示该 `BlockEntity` 可附着的方块集合。

```java
// 假设有 DeferredRegister<BlockEntityType<?>> REGISTER
public static final RegistryObject<BlockEntityType<MyBE>> MY_BE = REGISTER.register("mybe", () -> new BlockEntityType(MyBE::new, Set.of(validBlocks)));

// 在 MyBE（BlockEntity 子类）中
public MyBE(BlockPos pos, BlockState state) {
  super(MY_BE.get(), pos, state);
}
```

!!! note
    在 1.21.3 之前的版本中，构造 `BlockEntityType` 时使用其 Builder 形式：`BlockEntityType$Builder#of`，该方法接收一个 `BlockEntityType$BlockEntitySupplier`（用于创建实例）以及可变参数的 `Block` 列表表示附着的方块。随后调用 `BlockEntityType$Builder#build` 构建 `BlockEntityType`，并传入一个可用于 `DataFixer` 的类型引用（若不使用 `DataFixer`，可传入 `null`）。

## 创建 `BlockEntity`

要创建一个 `BlockEntity` 并将其附着到 `Block`，你的 `Block` 子类需要实现 `EntityBlock` 接口，并实现 `EntityBlock#newBlockEntity(BlockPos, BlockState)` 方法以返回新的 `BlockEntity` 实例。

## 在 `BlockEntity` 中存储数据

要保存数据，请重写以下两个方法：
```java
BlockEntity#saveAdditional(CompoundTag tag)

BlockEntity#load(CompoundTag tag)
```
这些方法会在包含 `BlockEntity` 的 `LevelChunk` 从/写入 tag 时被调用，用于读取与写入 `BlockEntity` 类中的字段。

!!! note
    每当数据发生变化时，需要调用 `BlockEntity#setChanged`；否则包含该 `BlockEntity` 的 `LevelChunk` 可能在保存世界时被跳过。

!!! important
    请务必在覆盖时调用 `super` 方法！

    `super` 方法保留并使用了标签名 `id`、`x`、`y`、`z`、`ForgeData` 与 `ForgeCaps`，这些名称为保留字。

## BlockEntity 的刻（Ticking）

如果需要一个会刻动（ticking）的 `BlockEntity`（例如跟踪冶炼进度），需在 `EntityBlock` 中重写 `EntityBlock#getTicker(Level, BlockState, BlockEntityType)` 方法。该方法可根据逻辑侧（客户端/服务端）返回不同的 ticker，或返回通用的 ticker。返回类型为 `BlockEntityTicker`，因为这是一个函数式接口，可直接传入表示 ticker 的方法引用：

```java
// 在某个 Block 子类内
@Nullable
@Override
public <T extends BlockEntity> BlockEntityTicker<T> getTicker(Level level, BlockState state, BlockEntityType<T> type) {
  return type == MyBlockEntityTypes.MYBE.get() ? MyBlockEntity::tick : null;
}

// 在 MyBlockEntity 中
public static void tick(Level level, BlockPos pos, BlockState state, MyBlockEntity blockEntity) {
  // 执行任务
}
```

!!! note
    该方法每个刻都会被调用，因此应避免在此处执行复杂计算。若可能，建议每隔 X 个刻执行一次复杂计算。（每秒的刻数可能低于 20，但不会高于 20）

## 将数据同步到客户端

有三种方式将数据同步到客户端：在区块（chunk）加载时同步、在方块更新时同步、或使用自定义网络消息同步。

### 在 LevelChunk 加载时同步

为此需重写：
```java
BlockEntity#getUpdateTag()

IForgeBlockEntity#handleUpdateTag(CompoundTag tag)
```
第一方法用于收集应发送给客户端的数据，第二方法用于处理接收到的数据。如果 `BlockEntity` 的数据量较少，可能可以复用[“在 BlockEntity 中存储数据”][storing-data] 一节中的方法。

!!! important
    同步过多或无用的数据会导致网络拥堵。应仅在客户端需要时发送必要信息。例如通常不需要在更新标签中发送完整的容器物品列表，因为可通过其对应的 `AbstractContainerMenu` 来同步。

### 在方块更新时同步

该方法稍复杂，但仍需重写两到三个方法。示例实现：
```java
@Override
public CompoundTag getUpdateTag() {
  CompoundTag tag = new CompoundTag();
  // 将数据写入 tag
  return tag;
}

@Override
public Packet<ClientGamePacketListener> getUpdatePacket() {
  // 将使用 #getUpdateTag 的返回值
  return ClientboundBlockEntityDataPacket.create(this);
}

// 可覆盖 IForgeBlockEntity#onDataPacket。默认行为会委托给 #load。
```
静态构造器 `ClientboundBlockEntityDataPacket#create` 接受：

* `BlockEntity`。
* 一个可选的函数，用于从 `BlockEntity` 获取 `CompoundTag`。默认使用 `BlockEntity#getUpdateTag`。

要发送该数据包，需在服务端发送方块更新通知：
```java
Level#sendBlockUpdated(BlockPos pos, BlockState oldState, BlockState newState, int flags)
```
`pos` 应为 `BlockEntity` 的位置。`oldState` 与 `newState` 可传入该位置当前的 `BlockState`。`flags` 为位掩码，应包含 `2`，该标志将把变更同步到客户端。详见 `Block` 中关于其它标志的说明。标志 `2` 等同于 `Block#UPDATE_CLIENTS`。

### 使用自定义网络消息同步

这种方式通常最为复杂，但常常是最优化的，因为你能确保只同步必要的数据。建议先阅读 [`Networking`][networking] 与其下的 [`SimpleImpl`][simple_impl]，再尝试实现。
创建自定义网络消息后，可使用 `SimpleChannel#send(PacketDistributor$PacketTarget, MSG)` 将其发送给所有已加载该 `BlockEntity` 的玩家。

!!! warning
    请务必进行安全性检查：消息到达玩家时，`BlockEntity` 可能已被销毁或替换！同时应检查区块是否已加载（`Level#hasChunkAt(BlockPos)`）。

[registration]: ../concepts/registries.md#methods-for-registering
[storing-data]: #storing-data-within-your-blockentity
[menu]: ../gui/menus.md
[networking]: ../networking/networking.md

[simple_impl]: ../networking/simpleimpl.md
