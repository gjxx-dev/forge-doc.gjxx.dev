# 配方生成

可以通过继承 `RecipeProvider` 并实现 `#buildRecipes` 为模组生成配方（recipes）。当 `FinishedRecipe` 实例被提供给消费者时，该配方即被提交用于数据生成。`FinishedRecipe` 可手动构建并提供，或使用便捷的 `RecipeBuilder` 来生成。

实现后，应将提供者通过 `DataGenerator#addProvider` 注册到生成器中（参见 [datagen]）。

```java
// 在 MOD 事件总线上
@SubscribeEvent
public void gatherData(GatherDataEvent event) {
    event.getGenerator().addProvider(
        // 仅在生成服务器数据时运行
        event.includeServer(),
        MyRecipeProvider::new
    );
}
```

`RecipeBuilder`
---------------

`RecipeBuilder` 是用于创建要生成的 `FinishedRecipe` 的便捷实现，提供了解锁（unlocking）、分组（group）、保存（save）以及获取配方结果（getResult）等基础功能，分别通过 `#unlockedBy`、`#group`、`#save` 与 `#getResult` 来完成。

!!! important
    在原版的配方构建器中不支持 `ItemStack` 形式的输出（参见资源）。若要生成具有 `ItemStack` 输出的配方，必须以不同方式构建 `FinishedRecipe`，以便兼容原版的配方序列化器。

!!! warning
    生成的物品结果必须指定有效的 `RecipeCategory`，否则会抛出 `NullPointerException`。

除了 [`SpecialRecipeBuilder`] 外，所有配方构建器都要求指定进度（advancement）条件。所有配方会为玩家已使用该配方的情况自动生成一个解锁条件，但仍需额外指定至少一个条件以便玩家在未使用过配方的情况下获取该配方（比如放入某个物品至背包）。若指定的任一条件为真，玩家即可在配方书中获得该配方。

!!! tip
    配方条件通常使用 `InventoryChangeTrigger`，当用户库存中包含某些物品时自动解锁配方。

### ShapedRecipeBuilder（有形配方）

`ShapedRecipeBuilder` 用于生成有形配方（shaped recipes），通过 `#shaped` 初始化。可在保存前指定配方分组、符号图案、符号对应的材料以及配方的解锁条件。

```java
// 在 RecipeProvider#buildRecipes(writer)
ShapedRecipeBuilder builder = ShapedRecipeBuilder.shaped(RecipeCategory.MISC, result)
  .pattern("a a") // 配方图案
  .define('a', item) // 定义符号对应的材料
  .unlockedBy("criteria", criteria) // 解锁方式
  .save(writer); // 写出数据
```

#### 额外校验

有形配方在构建前会执行额外校验：

* 必须定义一个图案且图案至少包含一个材料符号。
* 图案的每一行宽度必须一致。
* 同一符号不能被重复定义。
* 空格字符 `' '` 保留用于表示该槽为空，不能被定义为材料符号。
* 图案必须使用所有已定义的符号。

### ShapelessRecipeBuilder（无序配方）

`ShapelessRecipeBuilder` 用于生成无序配方，通过 `#shapeless` 初始化。可在保存前指定分组、所需材料以及解锁条件。

```java
// 在 RecipeProvider#buildRecipes(writer)
ShapelessRecipeBuilder builder = ShapelessRecipeBuilder.shapeless(RecipeCategory.MISC, result)
  .requires(item) // 添加所需材料
  .unlockedBy("criteria", criteria) // 解锁方式
  .save(writer); // 写出数据
```

### SimpleCookingRecipeBuilder（简单烹饪配方）

`SimpleCookingRecipeBuilder` 用于生成熔炉、鼓风炉、熏制与篝火烹饪配方，或使用 `SimpleCookingSerializer` 的自定义烹饪配方。通过 `#smelting`、`#blasting`、`#smoking`、`#campfireCooking` 或 `#cooking` 初始化，保存前可指定组和解锁条件。

```java
// 在 RecipeProvider#buildRecipes(writer)
SimpleCookingRecipeBuilder builder = SimpleCookingRecipeBuilder.smelting(input, RecipeCategory.MISC, result, experience, cookingTime)
  .unlockedBy("criteria", criteria)
  .save(writer);
```

### SingleItemRecipeBuilder（单物品配方）

`SingleItemRecipeBuilder` 用于生成切石（stonecutting）类配方，或使用 `SingleItemRecipe$Serializer` 的自定义单物品配方。通过 `#stonecutting` 或构造器初始化，保存前可指定分组与解锁条件。

```java
// 在 RecipeProvider#buildRecipes(writer)
SingleItemRecipeBuilder builder = SingleItemRecipeBuilder.stonecutting(input, RecipeCategory.MISC, result)
  .unlockedBy("criteria", criteria)
  .save(writer);
```

非 `RecipeBuilder` 的构建器
----------------------------
某些配方构建器不实现 `RecipeBuilder`（因其不具备所有通用功能），例如以下几种。

### SmithingTransformRecipeBuilder（铁匠台变换）

用于生成将物品转换为另一个物品的锻造（smithing）配方，可通过 `#smithing` 初始化或使用构造器。保存前可指定解锁条件。

```java
// 在 RecipeProvider#buildRecipes(writer)
SmithingTransformRecipeBuilder builder = SmithingTransformRecipeBuilder.smithing(template, base, addition, RecipeCategory.MISC, result)
  .unlocks("criteria", criteria)
  .save(writer, name);
```

### SmithingTrimRecipeBuilder（锻造装饰修饰）

用于生成用于盔甲修饰（armor trims）的锻造配方，通过 `#smithingTrim` 初始化或使用构造器。保存前可指定解锁条件。

```java
// 在 RecipeProvider#buildRecipes(writer)
SmithingTrimRecipe builder = SmithingTrimRecipe.smithingTrim(template, base, addition, RecipeCategory.MISC)
  .unlocks("criteria", criteria)
  .save(writer, name);
```

### SpecialRecipeBuilder（特殊配方）

用于为动态配方（无法用标准 JSON 表示的配方，如盔甲消亡、烟花等）生成空的 JSON。通过 `#special` 初始化并保存。

```java
// 在 RecipeProvider#buildRecipes(writer)
SpecialRecipeBuilder.special(dynamicRecipeSerializer)
  .save(writer, name);
```

条件配方（Conditional Recipes）
-------------------
可通过 `ConditionalRecipe$Builder` 生成条件配方。使用 `#builder` 获取构建器，先通过 `#addCondition` 添加条件，再通过 `#addRecipe` 添加在条件成立时返回的配方。可多次重复这一过程。最后使用 `#generateAdvancement` 为这些配方生成进度，或使用 `#setAdvancement` 指定条件进度。

```java
// 在 RecipeProvider#buildRecipes(writer)
ConditionalRecipe.builder()
  .addCondition(...)
  .addRecipe(...)
  .addCondition(...)
  .addRecipe(...)
  .generateAdvancement()
  .build(writer, name);
```

### IConditionBuilder

为了简化向条件配方添加条件而无需手动构造每个条件实例，可让扩展的 `RecipeProvider` 实现 `IConditionBuilder` 接口，该接口提供便捷的方法来构造条件实例。

```java
// 在 ConditionalRecipe$Builder#addCondition 中使用 IConditionBuilder 提供的方法构造复杂条件
and(
  or(
    itemExists("examplemod", "example_item"),
    itemExists("examplemod", "example_item2")
  ),
  not(FALSE())
)
```

自定义配方序列化器
------------------
可以通过创建能构建 `FinishedRecipe` 的自定义构建器来为自定义配方生成数据。`FinishedRecipe` 会对配方数据及其解锁进度进行编码（若存在），同时指定配方的名称与序列化器，以便生成时写入正确路径并在加载时由对应序列化器解析。

!!! tip
    `FinishedRecipe` 的灵活性允许对任意对象的转换进行数据生成，而不仅限于物品。

[datagen]: ../datagen.md#data-providers
[ingredients]: ../../resources/server/recipes/ingredients.md#forge-types
[stack]: ../../resources/server/recipes/recipes.md#recipe-itemstack-result
[conditional]: ../../resources/server/conditional.md
[special]: #specialrecipebuilder
