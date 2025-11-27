# 覆盖层（Overlays）

有时候，我们希望在不打断玩家移动或操作的情况下向其显示信息，就像按下 F3 或记分板那样。这类 GUI 元素称为覆盖层（overlay）。覆盖层会在任何可见的 [screen] 之下渲染，因此当屏幕打开时它们会被视觉上遮挡（尽管它们可能仍在渲染！）。

关于使用 `Gui Graphics` 进行渲染的内容，请参见 [screens]，此处不再赘述。

# 背景

此前，Forge 包含两个事件：`RenderGuiOverlayEvent` 和 `RegisterGuiOverlayEvent`。前者会在每次渲染覆盖层时触发，允许模组作者在需要时添加自己的渲染或取消渲染。后者在初始化期间的某个时刻触发一次，允许模组作者（如其名）注册他们自己的覆盖层以供使用。

自 1.20.6 起，Mojang 修改了覆盖层的创建与渲染方式，使得原有系统过时，转而使用 `LayeredDraw` 类和 `Layer` 接口。`LayeredDraw` 使用一个内部的匿名渲染函数列表，这些函数遵循 `Layer` 接口。因为这些条目是匿名的，无法确定列表中的哪个 `Layer` 对应 `Gui` 中的特定渲染方法。

`RegisterGuiOverlayEvent` 的行为已被恢复，允许模组作者在一次性事件中将自己的渲染层插入到该列表中。

!!! important  从 1.21.6 开始，该系统再次发生变化，移除了 `Layer` 和 `LayeredDraw`。因此在 1.21.6 及更高版本中，应将 `Layer` 替换为 `ForgeLayer`。不过本篇文档其余部分仍然适用。

# Forge 的分层绘制（Forge Layered Draw）

一个 `LayeredDraw` 表示一个可渲染 `Layer` 的列表。在运行时，会调用 `LayeredDraw#render` 来执行内部 `Layer` 列表的渲染代码。此外，一个 `LayeredDraw` 可以被添加到另一个 `LayeredDraw` 的渲染列表中，从而形成可渲染节点的树结构。

Forge 在此实现上扩展出 `ForgeLayeredDraw`，为原版的 `LayeredDraw` 与 `Layer` 提供 `ResourceLocation`，以便进行排序。要开始向系统添加自定义的 `Layer` 与 `ForgeLayeredDraw`，请监听在 mod 总线上触发的 `AddGuiOverlayLayersEvent`。


### 原版绘制顺序

默认情况下，原版包含三个 `LayeredDraw` 实例。事件提供的实例是 `ForgeLayeredDraw#VANILLA_ROOT`。在下文中，我们将把该 `ForgeLayeredDraw` 实例称为全局父节点。其内容如下：

| Internal Name    |      Resource Location       | Type             |
| :--------------- | :--------------------------: | :--------------- |
| PRE_SLEEP_STACK  | "minecraft:pre_sleep_phase"  | ForgeLayeredDraw |
| SLEEP_OVERLAY    |  "minecraft:sleep_overlay"   | Layer            |
| POST_SLEEP_STACK | "minecraft:post_sleep_phase" | ForgeLayeredDraw |

`ForgeLayeredDraw#PRE_SLEEP_STACK` 的内容完全由 `Layer` 实例组成，如下：

| Internal Name  | Resource Location          | Note       |
| :------------- | :------------------------- | :--------- |
| CAMERA_OVERLAY | "minecraft:camera_overlay" |
| CROSSHAIR      | "minecraft:crosshair"      |
| CHANGE_STRATUM | "stratum_change"           | 仅 1.21.6+ |
| HOTBAR         | "minecraft:hotbar"         |
| EXPERIENCE     | "minecraft:experience"     |
| POTION_EFFECTS | "minecraft:potion_effects" |
| BOSS_OVERLAY   | "minecraft:boss_overlay"   |

在 sleep overlay 渲染之后，会渲染 `ForgeLayeredDraw#POST_SLEEP_STACK` 的内容，其也完全由 `Layer` 实例组成：

| Internal Name    | Resource Location          |
| :--------------- | :------------------------- |
| DEMO_OVERLAY     | "minecraft:demo"           |
| DEBUG_OVERLAY    | "minecraft:debug"          |
| SCOREBOARD       | "minecraft:scoreboard"     |
| HOTBAR_MESSAGE   | "minecraft:hotbar_message" |
| TITLE_OVERLAY    | "minecraft:title"          |
| CHAT_OVERLAY     | "minecraft:chat_overlay"   |
| TAB_LIST         | "minecraft:tab_list"       |
| SUBTITLE_OVERLAY | "minecraft:subtitle"       |

!!! important 上述所有信息均记录在 `ForgeLayeredDraw` 的 javadoc 中。如果不确定某个 layer 包含什么，请检查 `Gui` 中对应的渲染代码。对于 1.21.6 及以上版本，原版的顺序初始化也记录在 `ForgeLayeredDraw#init` 中。

### 关于 Layer 顺序的说明

最终的渲染顺序只有在所有事件监听器完成后才会计算。尝试在事件结束后添加新层将不会生效。此外，由于可以（但强烈不建议）使用 `ForgeLayeredDraw#move` 对现有层重新排序，因此无法绝对保证某一层在任意时刻的位置。

此外，层不能跨 `ForgeLayeredDraw` 边界移动。一旦某层有了父节点，它就会保持在该父节点内。如果你想实现跨堆栈移动，应先取消原始层，然后在目标父节点中添加一个新的层。

最后，如果目标（即用于排序的参照对象）不存在，将会发出相应警告并且不会做任何更改。`ForgeLayeredDraw` 的所有方法调用都遵循此规则：不会有任何调用使层顺序处于无效状态。
### 向 ForgeLayeredDraw 添加层

`ForgeLayeredDraw#add` 方法有多个重载。其中两个用于注册原版层且在任何情况下都不应使用，它们已用 `@Deprecated` 标注。

添加 `Layer` 的示例：
```java
class MyClass {
    public static void addMyLayers(AddGuiOverlayLayersEvent event) {
        // 我们没有指定任何目标，
        // 因此这将被添加到 VANILLA_ROOT 列表的末尾。
        event.getLayeredDraw().add(
                ResourceLocation.fromNamespaceAndPath(MY_MODID, "eye_blinder_supreme"),
                (guiGraphics, deltaTracker) -> {
                    // 我们想要的渲染代码
                }
        );
        event.getLayeredDraw().add(
                ResourceLocation.fromNamespaceAndPath(MY_MODID, "dancing_cat"),
                MyClass::renderMethod
        );
    }

    private static void renderMethod(GuiGraphics guiGraphics, DeltaTracker deltaTracker) {
        // 其他渲染代码
    }
}
```
层名称在全局并不要求唯一，它们可以在不同的 `ForgeLayeredDraw` 实例间重复使用，但在同一实例内不得重复使用。

```java
// 假设上面的代码也已执行
public static void addMyLayers(AddGuiOverlayLayersEvent event) {
    ResourceLocation rl = ResourceLocation.fromNamespaceAndPath(MY_MODID, "my_cool_layer_list");
    ForgeLayeredDraw myStack = new ForgeLayeredDraw(rl);
    myStack.add( 
            ResourceLocation.fromNamespaceAndPath(MY_MODID, "eye_blinder_supreme"),
            (guiGraphics, deltaTracker) -> {/* ... */}
    );
    // 因为该层位于不同的绘制栈中，
    // 所以允许重复使用 ResourceLocation
    event.getLayeredDraw().add(myStack.getName(), myStack, () -> true);
    // 栈的条件提供器是必需的，若希望总是渲染则让其返回 true
    // *除非另有模组添加了其他条件。它们可以叠加！
}
```

### 取消层的渲染

此前，模组作者需要使用 `RenderGuiOverlayEvent` 来取消覆盖层的渲染。现在，可以简单地为现有 `Layer` 或整个 `ForgeLayeredDraw` 添加条件来控制渲染。

要取消一个已存在的层，请使用 `ForgeLayeredDraw#addConditionTo`。该方法提供两个重载：一个用于目标层存在于调用者对象（即在该实例上调用 `addConditionTo`），另一个用于在全局父节点上调用。传入的 `BooleanSupplier` 用于指示是否应进行渲染。

如果对对应 `ForgeLayeredDraw` 对象的目标添加了条件，则该条件会应用于对象内的所有子层。这对于通过单一布尔检查禁用多个层非常有用（这就是原版处理按 F1 隐藏 UI 的方式）。换言之，如果父节点被取消，则所有子层也会被自动取消。此时不会调用任何子层的 `Layer#render` 方法。

### 修改已有层

直接修改已存在层的渲染元素在 `ForgeLayeredDraw` 中**不受支持**。如果希望以 API 友好的方式做到这一点，应整体取消原始层并自行完成渲染。

[screens]: ./screens.md
[screen]: ./screens.md
