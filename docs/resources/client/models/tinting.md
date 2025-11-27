# 纹理着色

原版中许多方块和物品会根据所在位置或属性改变其纹理颜色，例如草方块。模型支持在面上指定“tint index”（染色索引），这是整数值，可由 `BlockColor` 和 `ItemColor` 处理。关于原版模型中染色索引的定义，请参见 [wiki][]。

### `BlockColor` / `ItemColor`

这两个接口都是单方法接口。`BlockColor` 接受一个 `BlockState`、一个（可为空的）`BlockAndTintGetter` 和一个（可为空的）`BlockPos`。`ItemColor` 接受一个 `ItemStack`。两者都接受一个 `int` 参数 `tintIndex`，表示被着色面的索引。两者返回一个 `int`，表示颜色乘数（color multiplier）。该 `int` 被视为由四个无符号字节组成：alpha、red、green、blue（从最显著字节到最不显著字节）。对于每个被染色像素，通道值的计算为 `(int)((float) base * multiplier / 255.0)`，其中 `base` 为该通道的原始值，`multiplier` 为颜色乘数中对应字节的值。注意方块不会使用 alpha 通道。例如，未着色时草纹理看上去为白灰色；草的 `BlockColor` / `ItemColor` 在温暖生物群系返回较低的红/蓝分量和较高的 alpha/绿分量，因此乘法后会突出绿色，弱化红/蓝。

若物品继承自 `builtin/generated` 模型，则每个层（"layer0"、"layer1" 等）都有与其层索引对应的 tint index。

### 创建颜色处理器

`BlockColor` 需要注册到游戏的 `BlockColors` 实例。可以通过 `RegisterColorHandlersEvent$Block` 获取 `BlockColors`，并通过 `#register` 注册 `BlockColor`。注意这不会使对应的 `BlockItem` 被着色；`BlockItem` 是物品，需通过 `ItemColor` 进行着色。

```java
@SubscribeEvent
public void registerBlockColors(RegisterColorHandlersEvent.Block event){
  event.register(myBlockColor, coloredBlock1, coloredBlock2, ...);
}
```

`ItemColor` 需要注册到游戏的 `ItemColors` 实例。可以通过 `RegisterColorHandlersEvent$Item` 获取 `ItemColors`，并通过 `#register` 注册 `ItemColor`。此方法被重载以接受 `Block`，相当于为 `Block#asItem`（即该方块的 `BlockItem`）注册颜色处理器。

```java
@SubscribeEvent
public void registerItemColors(RegisterColorHandlersEvent.Item event){
  event.register(myItemColor, coloredItem1, coloredItem2, ...);
}
```

[wiki]: https://minecraft.wiki/w/Tutorials/Models#Block_models

