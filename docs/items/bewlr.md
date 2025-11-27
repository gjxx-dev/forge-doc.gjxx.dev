# BlockEntityWithoutLevelRenderer（BEWLR）

`BlockEntityWithoutLevelRenderer` 是用于在物品上处理动态渲染的机制。该系统比旧的 `ItemStack` 渲染系统更简单，旧系统需要 `BlockEntity` 且无法直接访问 `ItemStack`。

使用 BEWLR
-----------

通过 BEWLR，你可以实现如下渲染方法：

```java
public void renderByItem(ItemStack itemStack, ItemDisplayContext ctx, PoseStack poseStack, MultiBufferSource bufferSource, int combinedLight, int combinedOverlay)
```

要使物品使用 BEWLR，其模型需在 `BakedModel#isCustomRenderer` 返回 `true`。若模型未标记为自定义渲染，则会使用默认的 `ItemRenderer#getBlockEntityRenderer`。当返回 `true` 时，物品的 BEWLR 实例将被用于渲染。

!!! note
    若 `Block#getRenderShape` 设置为 `RenderShape#ENTITYBLOCK_ANIMATED`，方块也会使用 BEWLR 进行渲染。

为物品设置 BEWLR
-----------------

需要在 `Item#initializeClient` 中通过 `Consumer<IClientItemExtensions>` 提供一个匿名的 `IClientItemExtensions` 实例，并在其中重写 `getCustomRenderer` 返回你的 BEWLR 实例：

```java
@Override
public void initializeClient(Consumer<IClientItemExtensions> consumer) {
  consumer.accept(new IClientItemExtensions() {

    @Override
    public BlockEntityWithoutLevelRenderer getCustomRenderer() {
      return myBEWLRInstance;
    }
  });
}
```

!!! important
    每个模组应仅保留一个自定义 BEWLR 实例。

只要满足上述条件，使用 BEWLR 无需额外设置。
