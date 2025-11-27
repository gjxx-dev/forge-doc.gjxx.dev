# ItemOverrides

`ItemOverrides` 提供了一种方式，让一个 [`BakedModel`][baked] 能基于 `ItemStack` 的状态处理并返回一个新的 `BakedModel`；返回的模型会替换原有模型。`ItemOverrides` 表示一个任意函数 `(BakedModel, ItemStack, ClientLevel, LivingEntity, int)` → `BakedModel`，因此适用于动态模型。原版中，它用于实现物品属性重写（item property overrides）。

### `ItemOverrides()`

构造函数接受一个 `ItemOverride` 列表，并对该列表进行拷贝与 bake（烘焙）。已烘焙的 overrides 可通过 `#getOverrides` 访问。

### `resolve`

该方法接受一个 `BakedModel`、一个 `ItemStack`、一个 `ClientLevel`、一个 `LivingEntity` 和一个 `int`，并返回用于渲染的另一个 `BakedModel`。这里是模型根据物品状态选择或修改自身的地方。

该方法不应修改关卡（level）。

### `getOverrides`

返回一个不可变列表，包含该 `ItemOverrides` 使用的所有 [`BakedOverride`][override]。如果没有适用的重写，则返回空列表。

## `BakedOverride`

此类表示原版的物品重写（item override），它保存多个 `ItemOverrides$PropertyMatcher` 用于匹配物品的属性，以及在匹配成功时使用的目标模型。它们对应于原版物品 JSON 模型中 `overrides` 数组中的对象：

```js
{
  // 在原版 JSON 物品模型中
  "overrides": [
    {
      // 这是一个 ItemOverride
      "predicate": {
        // 这是 Map<ResourceLocation, Float>，包含属性名及其最小值
        "example1:prop": 0.5
      },
      // 当上述 predicate 匹配时使用的目标模型
      "model": "example1:item/model"
    },
    {
      // 另一个 ItemOverride
      "predicate": {
        "example2:prop": 1
      },
      "model": "example2:item/model"
    }
  ]
}
```

[baked]: ./bakedmodel.md
[override]: #bakedoverride
