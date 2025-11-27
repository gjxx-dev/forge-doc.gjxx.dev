# 配方

配方是将若干对象在 Minecraft 世界中转换为其它对象的一种方式。尽管原版系统主要处理物品（ItemStack）之间的转换，但整个系统可以扩展为使用程序员自定义的任意对象。

数据驱动配方
-------------------

原版的大多数配方通过 JSON 实现数据驱动（data driven）。这意味着无需模组即可创建新配方，只需编写一个数据包（Data pack）。关于如何在模组的 `resources` 目录内创建和放置这些配方的完整说明请参阅 [Minecraft Wiki][wiki]。

配方可以作为完成某个 [进度][advancement] 的奖励出现在合成配方书（Recipe Book）中。配方进度的父节点始终为 `minecraft:recipes/root`，因此不会显示在进度界面上。默认的解锁判定会检查玩家是否已通过使用配方或使用 `/recipe` 等命令获得该配方：

```js
// 在某个配方进度 JSON 中
"has_the_recipe": { // 条件标签
  // 当 examplemod:example_recipe 被使用时通过
  "trigger": "minecraft:recipe_unlocked",
  "conditions": {
    "recipe": "examplemod:example_recipe"
  }
}
// ...
"requirements": [
  [
    "has_the_recipe"
    // ... 其它 OR 逻辑的条件标签
  ]
]
```

数据驱动的配方及其解锁进度可以通过 `RecipeProvider` [生成][datagen]。

配方管理器
--------------

配方由 `RecipeManager` 加载与存储。与获取可用配方相关的操作由该管理器处理。两个常用方法如下：

 |      方法       | 描述                           |
 | :-------------: | :----------------------------- |
 | `getRecipeFor`  | 获取第一个匹配当前输入的配方。 |
 | `getRecipesFor` | 获取所有匹配当前输入的配方。   |

每个方法接受一个 `RecipeType`（表示配方的上下文：合成、熔炉等）、一个表示输入配置的 `Container`，以及传递给 `Recipe#matches` 的当前 `Level`（世界）。

!!! important
    Forge 提供了 `RecipeWrapper` 工具类，它扩展自 `Container`，用于将 `IItemHandler` 包装并传给需要 `Container` 参数的方法。

```java
// 在某个需要 IItemHandlerModifiable handler 的方法内
recipeManager.getRecipeFor(RecipeType.CRAFTING, new RecipeWrapper(handler), level);
```

扩展特性
-------------------

Forge 对配方模式和实现提供了若干扩展，以便更灵活地控制配方系统。

### 配方的 ItemStack 输出

除 `minecraft:stonecutting` 外，原版的配方序列化器在某些情况下会把 `result` 扩展为一个完整的 `ItemStack`（`JsonObject`），而不仅仅是物品名与数量：

```js
// 在某个配方 JSON 中
"result": {
  "item": "examplemod:example_item",
  "count": 4,
  "nbt": {
      // NBT 数据
  }
}
```

!!! note
    对于无法用 JSON 对象直接表达的数据（例如 `IntArrayTag`），`nbt` 字段也可以作为字符串形式的 SNBT 提供。

### 条件配方

配方及其解锁进度可以根据外部条件（模组是否加载、物品是否存在等）[有条件地加载或默认化][conditional]。

### 更大的合成网格

默认情况下，原版合成网格最大为 3x3。可以在 `FMLCommonSetupEvent` 中调用 `ShapedRecipe#setCraftingSize` 来扩展宽度与高度。

!!! warning
    `ShapedRecipe#setCraftingSize` **不是** 线程安全的，因此应通过 `FMLCommonSetupEvent#enqueueWork` 将其入队到同步工作队列中执行。

较大的合成网格也可以通过 [数据生成][datagen] 创建。

### 材料类型（Ingredient Types）

Forge 增加了若干额外的 [材料类型][ingredients]，使配方输入能够检查标签数据或将多个材料合并为单个输入检查器。

[datapack]: https://minecraft.wiki/w/Data_pack
[wiki]: https://minecraft.wiki/w/Recipe
[advancement]: ../advancements.md
[datagen]: ../../../datagen/server/recipes.md
[cap]: ../../../datastorage/capabilities.md
[conditional]: ../conditional.md#implementations
[ingredients]: ./ingredients.md#forge-types
