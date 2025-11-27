# Transform

当 [`BakedModel`][bakedmodel] 作为物品渲染时，可以根据它所处的变换（transform）上下文应用特殊处理。“变换”表示模型被渲染的场景或上下文。可能的变换在代码中由 `ItemDisplayContext` 枚举表示。处理变换有两套系统：已弃用的原版系统（由 `BakedModel#getTransforms`、`ItemTransforms` 和 `ItemTransform` 组成）以及 Forge 的系统（通过 `IForgeBakedModel#applyTransform` 方法实现）。原版代码被修改以尽可能优先使用 `applyTransform`。

`ItemDisplayContext`
---------------

`NONE` - 默认用于显示实体（display entity）当没有上下文时，以及当 `Block` 的 `RenderShape` 设置为 `#ENTITYBLOCK_ANIMATED` 时由 Forge 使用。

`THIRD_PERSON_LEFT_HAND`/`THIRD_PERSON_RIGHT_HAND`/`FIRST_PERSON_LEFT_HAND`/`FIRST_PERSON_RIGHT_HAND` - 第一人称值表示玩家在自己手中持有物品的情况；第三人称值表示其他玩家持有物品且客户端以第三人称查看他们时的情况。左右手含义自明。

`HEAD` - 表示玩家戴在头盔槽（例如南瓜）中的物品。

`GUI` - 表示物品在 `Screen` 中渲染的情况。

`GROUND` - 表示物品作为 `ItemEntity` 在关卡中渲染的情况。

`FIXED` - 用于物品框（item frames）。

原版方式
---------------

原版处理变换的方式通过 `BakedModel#getTransforms`。该方法返回一个 `ItemTransforms`，这是一个简单对象，包含多个作为 `public final` 字段的 `ItemTransform`。`ItemTransform` 表示将应用于模型的旋转、平移和缩放。`ItemTransforms` 包含针对每个 `ItemDisplayContext`（除 `NONE` 外）的一组 `ItemTransform`。在原版实现中，对 `NONE` 调用 `#getTransform` 会返回默认变换 `ItemTransform#NO_TRANSFORM`。

Forge 已弃用整个原版变换系统，大多数 `BakedModel` 实现应在 `BakedModel#getTransforms` 中简单返回 `ItemTransforms#NO_TRANSFORMS`（这是默认实现），并改为实现 `#applyTransform`。

Forge 方式
-------------

Forge 所推荐的变换处理方式为 `#applyTransform`，该方法被补丁（patched）到 `BakedModel` 上，并取代 `#getTransforms`。

#### `BakedModel#applyTransform`

给定一个 `ItemDisplayContext`、`PoseStack` 和一个用于指示是否应用左手变换的布尔值，该方法返回一个要渲染的 `BakedModel`。由于返回的 `BakedModel` 可以是全新的模型，此方法比原版方法更灵活（例如：在手中看起来扁平的纸片，在地面上可能看起来皱巴巴）。

[bakedmodel]: ./bakedmodel.md

