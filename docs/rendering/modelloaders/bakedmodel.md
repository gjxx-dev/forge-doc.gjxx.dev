# BakedModel

`BakedModel` 是对原版模型加载器中 `UnbakedModel#bake` 或自定义模型加载器中 `IUnbakedGeometry#bake` 的结果。与纯粹表示形状且不涉及物品或方块概念的 `UnbakedModel` 或 `IUnbakedGeometry` 不同，`BakedModel` 并非那么抽象。它表示已经被优化并简化到几乎可以直接送往 GPU 的几何数据。它也可以根据物品或方块的状态来改变模型。

在大多数情况下，通常不需要手动实现此接口，可以使用现有的实现之一。

### `getOverrides`

返回用于该模型的 [`ItemOverrides`][overrides]。只有当该模型作为物品渲染时才会使用它。

### `useAmbientOcclusion`

如果模型作为关卡中的方块被渲染，且该方块不发光，并且启用了环境遮蔽（ambient occlusion），则模型会使用[环境遮蔽](ambocc)进行渲染。

### `isGui3d`

当模型作为物品在物品栏中渲染、作为实体置于地面、挂在物品框中等时，若返回 `false` 则会使模型看起来“平面”。在 GUI 中，这还会禁用光照。

### `isCustomRenderer`

!!! important
    除非你确切知道自己在做什么，否则直接 `return false` 即可。

当将该模型作为物品渲染时，若返回 `true`，该模型将不会按常规被渲染，而是回退到 `BlockEntityWithoutLevelRenderer#renderByItem`。对于某些原版物品（例如箱子和旗帜），该方法被硬编码为将物品的数据复制到一个 `BlockEntity` 中，然后使用 `BlockEntityRenderer` 来渲染该区块实体以替代物品。对于其他物品，则会使用 `IClientItemExtensions#getCustomRenderer` 提供的 `BlockEntityWithoutLevelRenderer` 实例。更多信息可参见 [BlockEntityWithoutLevelRenderer][bewlr] 页面。

### `getParticleIcon`

返回用于粒子的纹理。对于方块，当实体踩到它、破坏它等情况会显示该纹理；对于物品，则在物品破碎或被食用时显示。

!!! important
    无参的原版方法已被弃用，应使用 `#getParticleIcon(ModelData)`，因为模型数据可能会影响特定模型的渲染方式。

### <s>`getTransforms`</s>

已弃用，建议实现 `#applyTransform`。如果实现了 `#applyTransform`，默认实现已足够。参见 [Transform][transform]。

### `applyTransform`

参见 [Transform][transform]。

### `getQuads`

这是 `BakedModel` 的主要方法。它返回一个 `BakedQuad` 列表：这些对象包含将用于渲染模型的低级顶点数据。如果模型作为方块渲染，则传入的 `BlockState` 非空；如果模型作为物品渲染，则由 `#getOverrides` 返回的 `ItemOverrides` 负责处理物品的状态，而 `BlockState` 参数将为 `null`。

!!! note 
    `BakedQuad` 中顶点的原点位于底部西北角。顶点坐标小于 0 或大于 1 会将顶点放置在方块外部。为避免光照问题，请按逆时针顺序提供顶点。

传入的 `Direction` 用于面剔除（face culling）。如果与给定侧相邻的方块是不透明的，则与该侧相关联的面不会被渲染。如果该参数为 `null`，则返回所有非侧面相关的面（这些永远不会被剔除）。

`rand` 参数是 `Random` 的实例。

方法还接收一个非空的 `ModelData` 实例。可通过 `ModelProperty` 在渲染特定模型时定义额外数据。例如，`CompositeModel$Data` 是用于 `forge:composite` 模型加载器的子模型额外数据的一个属性。

注意：此方法调用频繁——对于关卡中每个方块，它会针对每个未被剔除的面和支持的方块渲染层组合调用（范围大约是 0 到 28 次）。因此该方法应尽可能快，并应大量使用缓存。

[overrides]: ./itemoverrides.md
[ambocc]: https://en.wikipedia.org/wiki/Ambient_occlusion
[bewlr]: ../../items/bewlr.md
[transform]: ./transform.md

