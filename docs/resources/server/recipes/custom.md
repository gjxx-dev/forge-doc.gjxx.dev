# 自定义配方

每个配方定义由三部分组成：保存数据并处理执行逻辑的 `Recipe` 实现、表示配方类别或上下文的 `RecipeType`、以及负责解码与网络通信的 `RecipeSerializer`。具体如何使用由实现者决定。

Recipe（配方）
------

`Recipe` 接口描述配方数据与执行逻辑，包括匹配输入与生成结果。配方子系统默认通过 `Container` 子类提供输入。

!!! important
    传入 `Recipe` 的 `Container` 应被视为不可变；若需进行可变操作，请先对输入调用 `ItemStack#copy` 并在副本上操作。

要能从管理器中获取配方实例，`#matches` 必须返回 true（用于检测输入是否匹配）。可以使用 `Ingredient#test` 进行校验。

若配方被选中，则通过 `#assemble` 构建结果，`#assemble` 可使用输入数据来生成输出。

!!! tip
    `#assemble` 应始终返回唯一的 `ItemStack` 实例；若不确定，请在返回前调用 `ItemStack#copy`。

示例：

```java
public record ExampleRecipe(Ingredient input, int data, ItemStack output) implements Recipe<Container> {
  // 在此实现方法
}
```

RecipeType（配方类型）
----------

`RecipeType` 定义配方将在哪种上下文中使用（例如熔炉、鼓风炉等）。若现有类型均不符合需求，需要注册新的 `RecipeType`。

新配方子类的 `Recipe#getType` 应返回相应的 `RecipeType` 实例。

```java
@Override
public RecipeType<?> getType() {
  return EXAMPLE_TYPE.get();
}
```

RecipeSerializer（配方序列化器）
----------------

`RecipeSerializer` 负责解码 JSON 并在网络间通信配方数据。由序列化器解码后的配方实例会被 `RecipeManager` 唯一保存。`RecipeSerializer` 必须注册。

需要实现的方法：

 |    方法     | 描述                                                    |
 | :---------: | :------------------------------------------------------ |
 |  fromJson   | 将 JSON 解码为配方子类型。                              |
 |  toNetwork  | 将配方编码写入缓冲区以发送到客户端（无需写入配方 id）。 |
 | fromNetwork | 从服务端发送的缓冲区中解码配方（无需解码配方 id）。     |

配方子类的 `Recipe#getSerializer` 应返回对应的 `RecipeSerializer` 实例。

```java
@Override
public RecipeSerializer<?> getSerializer() {
  return EXAMPLE_SERIALIZER.get();
}
```

!!! tip
    有若干便捷方法用于简化配方的数据读写：`Ingredient` 支持 `#fromJson`、`#toNetwork`、`#fromNetwork`，`ItemStack` 可通过 `CraftingHelper#getItemStack`、`FriendlyByteBuf#writeItem` 与 `FriendlyByteBuf#readItem` 读写。

构建 JSON
----------------

自定义配方的 JSON 存放位置与其它配方相同。`type` 字段应指定**配方序列化器**的注册名，其余字段由序列化器在解码时处理。

```js
{
  "type": "examplemod:example_serializer",
  "input": { /* 某种 ingredient */ },
  "data": 0,
  "output": { /* 某个堆栈输出 */ }
}
```

非物品逻辑
----------------

如果配方不使用物品作为输入或输出，则 `RecipeManager` 提供的常规方法可能不适用。可在自定义 `Recipe` 中添加用于验证有效性或返回结果的额外方法，然后通过 `RecipeManager#getAllRecipesFor` 获取该类型的所有配方并按需筛选。

```java
// 在某个自定义 Recipe 实现中
boolean matches(Level level, BlockPos pos);
BlockState assemble(RegistryAccess access);

// 在某个管理器类中查找配方
public Optional<ExampleRecipe> getRecipeFor(Level level, BlockPos pos) {
  return level.getRecipeManager()
    .getAllRecipesFor(exampleRecipeType)
    .stream()
    .filter(recipe -> recipe.matches(level, pos))
    .findFirst();
}
```

数据生成
---------------

任意自定义配方（无论输入/输出为何）均可转换为 `FinishedRecipe` 以用于 [数据生成][datagen]，通过 `RecipeProvider` 完成。

[forge]: ../../../concepts/registries.md#methods-for-registering
[json]: https://minecraft.wiki/w/Recipe#JSON_format
[manager]: ./index.md#recipe-manager
[datagen]: ../../../datagen/server/recipes.md#custom-recipe-serializers
