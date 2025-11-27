# 方块（Blocks）

方块显然是 Minecraft 世界的基础组成部分。它们构成地形、结构和各种机器。如果你想制作模组，极有可能会涉及添加方块。本页将引导你创建方块以及一些可以实现的功能。

创建方块
---------

### 基础方块

对于简单方块（无特殊功能，例如圆石、木板等），不需要自定义类。可以通过实例化 `Block` 类并传入一个 `BlockBehaviour$Properties` 对象来创建方块。该 `BlockBehaviour$Properties` 对象可通过 `BlockBehaviour$Properties#of` 创建，并可通过调用其方法进行定制。例如：

- `strength` - 硬度控制破坏方块所需的时间。该值为任意参考值，例如石头的硬度为 1.5，泥土为 0.5。如果方块应为不可破坏，可以使用硬度 -1.0（参见 `Blocks#BEDROCK` 的定义）。抗爆性（resistance）控制方块对爆炸的抗性，例如石头的抗爆性为 6.0，泥土为 0.5。
- `sound` - 控制方块被击打、破坏或放置时的音效；需要 `SoundType` 参数，更多细节见 [声音] 页面。
- `lightLevel` - 控制方块发光强度。接收一个以 `BlockState` 为参数并返回 0 到 15 值的函数。
- `friction` - 控制方块的摩擦系数（滑动性）。例如冰的滑动系数约为 0.98。

这些方法都是*可链式调用*的，可连续调用以组合属性。可查看 `Blocks` 类获取示例。

!!! note
    方块没有提供设置 `CreativeModeTab`（创造栏分组）的 setter。如果方块有对应的物品（如 `BlockItem`），则通过 `BuildCreativeModeTabContentsEvent` 来处理。此外，方块的翻译键（translation key）没有 setter，它由注册名通过 `Block#getDescriptionId` 生成。

### 高级方块

上面的方式仅适用于极其基础的方块。如果你希望添加例如玩家交互等功能，则需创建自定义类。`Block` 类包含许多方法，无法在此逐一说明。请查看本节中其他页面了解可对方块实现的功能。

注册方块
-------

方块必须被[注册][registering]才能生效。

!!! important
    游戏内世界中的方块（表示为 `BlockState`）与物品栏中的“方块”（表示为 `ItemStack`）是两种不同的概念。世界中的方块由 `Block` 实例定义行为；而物品栏内的项由 `Item` 控制。作为连接两者的桥梁，存在 `BlockItem` 类，它是 `Item` 的子类，包含字段 `block` 指向其代表的 `Block`。`BlockItem` 定义了作为物品时的“方块”行为，例如右键放置方块。也可以存在没有 `BlockItem` 的 `Block`（例如 `minecraft:water` 是一个方块，但没有对应的物品，因此无法作为物品持有）。

    当一个方块被注册时，*仅*注册了方块本身。方块不会自动拥有 `BlockItem`。要为方块创建基础的 `BlockItem`，应将 `BlockItem` 的注册名设置为该方块的注册名。也可以使用 `BlockItem` 的自定义子类。注册完 `BlockItem` 后，可以通过 `Block#asItem` 获取对应的物品；若不存在 `BlockItem`，`Block#asItem` 会返回 `Items#AIR`，因此在使用前应检查 `Block#asItem` 是否返回 `Items#AIR`。

#### 可选的方块注册方式

历史上曾有一些模组允许用户通过配置文件禁用方块/物品，但不建议这样做。注册数量没有上限，因此应在模组中注册所有方块！若希望通过配置禁用某个方块，应禁用其合成配方；若想在创造栏中隐藏方块，可在 `BuildCreativeModeTabContentsEvent` 中构建内容时使用 `FeatureFlag`。

延伸阅读
-------

有关方块属性（例如用于栅栏、墙等原版方块的属性）的信息，请参阅关于 [blockstates] 的章节。

[声音]: ../gameeffects/sounds.md
[creativetabs]: ../items/index.md#creative-tabs
[registering]: ../concepts/registries.md#methods-for-registering
[blockstates]: states.md
