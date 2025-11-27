# 物品属性

物品属性（item properties）让物品的“属性”可被模型系统读取。例如弓（bow），其关键属性是弓被拉开的程度。该信息用于选择弓的模型，从而实现拉弓的动画。

物品属性会为每个注册了该属性的 `ItemStack` 赋予一个 `float` 值，原版的物品模型定义可以使用这些值来定义“overrides”，即默认模型在满足某些 predicate 时被替换为另一个模型。它们的优点在于连续性。例如，弓使用物品属性定义拉弓动画，模型由一系列 float 谓词决定，通常在 `0.0F` 到 `1.0F` 之间。资源包可以沿着该连续区间为拉弓动画添加任意数量的模型，而不必局限于固定的几个“槽”。指南针和钟表也采用类似机制。

向物品添加属性
--------------------------

使用 `ItemProperties#register` 向某个物品添加属性。`Item` 参数为属性所附着的物品（例如 `ExampleItems#APPLE`）。`ResourceLocation` 参数为属性名（例如 `new ResourceLocation("pull")`）。`ItemPropertyFunction` 是一个函数式接口，接受 `ItemStack`、所属的 `ClientLevel`（可为空）、持有它的 `LivingEntity`（可为空）以及持有实体的 id（int，可能为 `0`），并返回该属性的 `float` 值。对于 mod 的自定义属性，建议使用该 mod 的 mod id 作为命名空间（例如 `examplemod:property`），不要仅使用 `property`（那会解析为 `minecraft:property`）。这些注册应在 `FMLClientSetupEvent` 中完成。
还有一个 `ItemProperties#registerGeneric` 方法，用于向所有物品添加属性，它不接收 `Item` 参数，因为适用于所有物品。

!!! important
    请使用 `FMLClientSetupEvent#enqueueWork` 来执行注册任务，因为 `ItemProperties` 内的数据结构不是线程安全的。

!!! note
    Mojang 已弃用 `ItemPropertyFunction`，推荐使用子接口 `ClampedItemPropertyFunction`，它会将结果夹到 0 到 1 之间。

使用 overrides
---------------

overrides 的格式可见 [wiki][format]，一个好的示例是 `model/item/bow.json`。下面是一个假设示例，演示如何基于 `examplemod:power` 属性进行模型重写。若无匹配项，则使用当前模型；若有多个匹配，则选择列表中最后一个匹配项。

!!! important
    谓词对 *大于或等于* 指定值的所有数值都适用。

```js
{
  "parent": "item/generated",
  "textures": {
    // 默认
    "layer0": "examplemod:items/example_partial"
  },
  "overrides": [
    {
      // power >= .75
      "predicate": {
        "examplemod:power": 0.75
      },
      "model": "examplemod:item/example_powered"
    }
  ]
}
```

下面是配套代码的示例。与 1.16.x 以下的旧版本不同，这一注册需要只在客户端完成，因为 `ItemProperties` 在服务器不存在。

```java
private void setup(final FMLClientSetupEvent event)
{
  event.enqueueWork(() ->
  {
    ItemProperties.register(ExampleItems.APPLE, 
      ResourceLocation.fromNamespaceAndPath(ExampleMod.MODID, "pulling"), (stack, level, living, id) -> {
        return living != null && living.isUsingItem() && living.getUseItem() == stack ? 1.0F : 0.0F;
      });
  });
}
```

[format]: https://minecraft.wiki/w/Tutorials/Models#Item_models

