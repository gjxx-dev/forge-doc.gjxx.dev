# 非数据包（Non-Datapack）配方

并非所有配方都足够简单或已迁移为数据驱动的配方。某些子系统仍需在代码层面上进行补丁或扩展，以支持添加新配方。

酿造配方（Brewing Recipes）
---------------

酿造（Brewing）仍是少数以代码实现的配方之一。酿造配方在 `PotionBrewing` 的引导（bootstrap）阶段被添加，用于容器、容器配方和药水混合。要扩展现有系统，Forge 允许在 `FMLCommonSetupEvent` 中通过 `BrewingRecipeRegistry#addRecipe` 添加酿造配方。

!!! warning
    `BrewingRecipeRegistry#addRecipe` 必须在同步工作队列中通过 `#enqueueWork` 调用，因为该方法不是线程安全的。

默认实现接受一个输入材料、一个催化剂材料以及一个输出堆栈作为标准实现；也可以传入 `IBrewingRecipe` 实例以实现自定义转换逻辑。

### IBrewingRecipe

`IBrewingRecipe` 是一个伪 `Recipe` 接口，用于检查输入与催化剂是否有效并在符合时返回对应输出。它通过 `#isInput`、`#isIngredient` 与 `#getOutput` 提供相应能力。`#getOutput` 可访问输入与催化剂堆栈以生成结果。

!!! important
    在复制 `ItemStack` 或 `CompoundTag` 数据时，请使用其 `#copy` 方法以创建独立实例，避免共享可变对象。

目前并没有类似原版那样的包装器用于添加额外的药水容器或混合模式；若需复现这类行为，需要实现新的 `IBrewingRecipe`。

铁砧配方（Anvil Recipes）
-------------

铁砧负责在提供材料及消耗经验等级的前提下修复或改造物品（例如修复耐久）。因此其系统并不容易完全数据驱动。不过可以借助 `AnvilUpdateEvent` 构建一个伪配方系统：该事件提供输入与材料，并允许模组设置输出、花费的经验与材料消耗数量；事件也可通过取消（[cancel][cancel]）来阻止任何输出。

```java
public void updateAnvil(AnvilUpdateEvent event) {
  if (event.getLeft().is(...) && event.getRight().is(...)) {
    event.setOutput(...);
    event.setCost(...);
    event.setMaterialCost(...);
  }
}
```

该事件必须注册到 Forge 事件总线上（attached）。

织机配方（Loom Recipes）
------------

织机用于向旗帜应用染料与图案（来自织机或物品）。旗帜必须为 `BannerItem`，染料为 `DyeItem`，但自定义图案可以创建并在织机中使用。可通过注册 `BannerPattern` 来添加新的旗帜图案。

!!! important
    属于 `minecraft:no_item_required` 标签的 `BannerPattern` 会在织机中作为选项显示；不在该标签内的图案必须有对应的 `BannerPatternItem` 才能在织机中使用并配合相应标签。

```java
private static final DeferredRegister<BannerPattern> REGISTER = DeferredRegister.create(Registries.BANNER_PATTERN, "examplemod");

public static final BannerPattern EXAMPLE_PATTERN = REGISTER.register("example_pattern", () -> new BannerPattern("examplemod:ep"));
```

[recipe]: ./custom.md#recipe
[cancel]: ../../../concepts/events.md#canceling
[attached]: ../../../concepts/events.md#creating-an-event-handler
[registering]: ../../../concepts/registries.md#registries-that-arent-forge-registries
