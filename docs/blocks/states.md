# 方块状态（Block States）

旧有行为（Legacy Behavior）
-----------------------------

在 Minecraft 1.7 及更早版本中，无法用 BlockEntity 存储放置或状态数据的方块使用**元数据（metadata）**。元数据是与方块一起存储的额外数字，用以表示不同的朝向、方向或完全不同的行为。

但是元数据系统十分令人困惑且受限，因为它只是与方块 ID 并存的一个数字，除了源码中的注释外没有任何语义。例如，要实现一个可朝向并能位于方块空间上半或下半（例如楼梯）的方块会写成：

```Java
switch (meta) {
  case 0: { ... } // 朝南并处于下半块
  case 1: { ... } // 朝南并处于上半块
  case 2: { ... } // 朝北并处于下半块
  case 3: { ... } // 朝北并处于上半块
  // ... 等等 ...
}
```

由于数字本身不携带含义，除非能访问源码与注释，否则没人能理解这些数字代表什么。

状态系统的引入（Introduction of States）
-----------------------------------------

在 Minecraft 1.8 及更高版本中，元数据与方块 ID 系统被弃用并最终替换为**方块状态（block state）系统**。该系统将方块的属性细节从方块的其他行为中抽象出来。

每个方块的*属性*由一个 `Property<?>` 实例描述。常见的属性示例包括音色（`EnumProperty<NoteBlockInstrument>`）、朝向（`DirectionProperty`）、是否带电（`Property<Boolean>`）等。每个属性的值类型为 `Property<T>` 中的参数类型 `T`。

通过将 `Block` 与一组 `Property<?>` 到其对应值的映射组合起来，可以构造一个唯一的配对，这个配对即为 `BlockState`。

旧有的无意义元数据值被更易理解和处理的方块属性系统所取代。例如，之前表示为“`minecraft:stone_button` 元数据为 `9`”的状态，现在可表示为“`minecraft:stone_button[facing=east,powered=true]`”。

正确使用方块状态（Proper Usage of Block States）
-----------------------------------------------

`BlockState` 系统灵活且强大，但也有其限制。`BlockState` 是不可变的，且其属性的所有组合会在游戏启动时生成。这意味着拥有大量属性和大量取值的 `BlockState` 会延长游戏加载时间，并增加理解方块逻辑的难度。

并非所有方块和场景都需要将属性放入 `BlockState`；只有方块最基本的属性应放入 `BlockState`，其他场景更适合使用 `BlockEntity` 或拆分为不同的 `Block`。在设计时请始终考虑是否真的需要使用 blockstates。

!!! note
    一个良好的经验法则是：**如果它有不同的名称，就应该是不同的方块**。

例如在实现椅子模型时：椅子的*朝向*应作为属性，而*木材类型*应划分为不同的方块。
“朝东的橡木椅”（`oak_chair[facing=east]`）与“朝西的云杉椅”（`spruce_chair[facing=west]`）应视为不同方块。

实现方块状态（Implementing Block States）
------------------------------------------

在你的 `Block` 类中，为每个属性创建或引用 `static final` 的 `Property<?>` 对象。你可以自行实现 `Property<?>`，但本文不涵盖如何实现自定义属性。原版（vanilla）代码提供了多种方便的实现：

* `IntegerProperty`
    * 实现了 `Property<Integer>`，表示整型属性。
    * 通过 `IntegerProperty#create(String propertyName, int minimum, int maximum)` 创建。
* `BooleanProperty`
    * 实现了 `Property<Boolean>`，表示布尔值属性（true/false）。
    * 通过 `BooleanProperty#create(String propertyName)` 创建。
* `EnumProperty<E extends Enum<E>>`
    * 实现了 `Property<E>`，表示枚举类型属性。
    * 通过 `EnumProperty#create(String propertyName, Class<E> enumClass)` 创建。
    * 也可以只使用枚举值的子集（例如在 16 个 `DyeColor` 中只使用 4 个），参见 `EnumProperty#create` 的重载方法。
* `DirectionProperty`
    * `EnumProperty<Direction>` 的便捷实现。
    * 提供了一些便捷的谓词，例如获取代表四个主方向的属性：`DirectionProperty.create("<name>", Direction.Plane.HORIZONTAL)`；或获取 X 轴方向：`DirectionProperty.create("<name>", Direction.Axis.X)`。

`BlockStateProperties` 类包含常用的原版属性，尽量优先使用或引用这些属性，而不是自行创建。

当你准备好所需的 `Property<>` 对象时，在你的 `Block` 类中重写 `Block#createBlockStateDefinition(StateDefinition$Builder)`。在该方法中调用 `StateDefinition$Builder#add(...)`，将希望包含的每个 `Property<?>` 作为参数传入。

每个方块还有一个自动选择的“默认”状态。可在构造函数中通过调用 `Block#registerDefaultState(BlockState)` 更改该默认状态。放置方块时，它将采用该默认状态。以下为 `DoorBlock` 的示例：

```Java
this.registerDefaultState(
  this.stateDefinition.any()
    .setValue(FACING, Direction.NORTH)
    .setValue(OPEN, false)
    .setValue(HINGE, DoorHingeSide.LEFT)
    .setValue(POWERED, false)
    .setValue(HALF, DoubleBlockHalf.LOWER)
);
```

若想在放置方块时更改所使用的 `BlockState`，可重写 `Block#getStateForPlacement(BlockPlaceContext)`，例如根据玩家放置时站立的位置设置朝向。

由于 `BlockState` 不可变，且所有可能的 `BlockState` 在启动时就已生成，调用 `BlockState#setValue(Property<T>, T)` 实际上会在方块的 `StateHolder` 中请求具有指定值集合的 `BlockState`。

由于所有可能的 `BlockState` 都在启动时生成，建议使用引用相等比较（`==`）检查两个 `BlockState` 是否相等。

使用 `BlockState`
----------------

可以通过调用 `BlockState#getValue(Property<?>)` 并传入相应属性来获取属性值。若想获得具有不同属性值的 `BlockState`，请调用 `BlockState#setValue(Property<T>, T)`。

可以通过 `Level#setBlockAndUpdate(BlockPos, BlockState)` 和 `Level#getBlockState(BlockPos)` 在世界中获取和设置 `BlockState`。若要放置方块，请调用 `Block#defaultBlockState()` 获取默认状态，并使用 `BlockState#setValue(Property<T>, T)` 修改为所需状态。

