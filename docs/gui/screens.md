# 屏幕

屏幕通常是 Minecraft 中所有图形用户界面（GUI）的基础：接收用户输入，在服务器端验证输入，并将结果同步回客户端。它们可以与 [menus] 结合使用，为类似物品栏的视图创建通信网络，或者作为独立元素由模组作者通过他们自己的 [network] 实现来处理。

屏幕由多个部分组成，因此很难完全理解 Minecraft 中“屏幕”究竟是什么。本文档会介绍屏幕的各个组件及其用法，然后再讨论屏幕本身。

## 相对坐标

无论渲染什么内容，都需要一个标识来指定它将出现的位置。在多重抽象下，大多数 Minecraft 的渲染调用会在一个坐标平面中接收 x、y 和 z 值。x 值从左到右递增，y 从上到下递增，z 从远到近增大。然而，这些坐标并没有固定的取值范围，会根据屏幕大小和游戏设置中的缩放而变化。因此，在渲染时必须格外注意使坐标值按可变屏幕尺寸正确缩放。

有关如何将坐标相对化的信息将在 [screen] 部分中说明。

!!! important
    如果你选择使用固定坐标或错误地缩放屏幕，渲染出来的对象可能会显得奇怪或位置不对。检查坐标是否正确相对化的一个简单方法是点击视频设置中的“Gui Scale”按钮。这个值会作为宽度和高度的除数，用于确定 GUI 应该以何种缩放比例渲染。

## Gui 图形（Gui Graphics）

Minecraft 中任何 GUI 的渲染通常都通过 `GuiGraphics` 完成。`GuiGraphics` 是几乎所有渲染方法的第一个参数；它包含用于渲染常用对象的基本方法。这些方法可归为五类：有色矩形、字符串、纹理、物品以及提示（tooltips）。此外，还有一个用于渲染组件片段的方法（`#enableScissor` / `#disableScissor`）。`GuiGraphics` 还暴露了用于施加变换以正确渲染组件位置的 `PoseStack`。另外，颜色使用 [ARGB][argb] 格式。

### 有色矩形

有色矩形通过位置颜色着色器绘制。可以绘制三种类型的有色矩形。

首先，有水平或垂直的单像素有色线，分别为 `#hLine` 和 `#vLine`。`#hLine` 接收两个 x 坐标，定义左端和右端（包含），一个顶部 y 坐标，以及颜色。`#vLine` 接收左侧 x 坐标、两个 y 坐标（定义顶部和底部，包含），以及颜色。

第二，是 `#fill` 方法，它在屏幕上绘制一个矩形。线段方法在内部会调用该方法。它接收左侧 x 坐标、顶部 y 坐标、右侧 x 坐标、底部 y 坐标以及颜色。

最后，是 `#fillGradient` 方法，用于绘制具有垂直渐变的矩形。它接收右侧 x 坐标、底部 y 坐标、左侧 x 坐标、顶部 y 坐标、z 坐标，以及底部和顶部颜色。

### 字符串

字符串通过其 `Font` 绘制，通常包含用于普通、透视和偏移模式的着色器。可以渲染两种对齐方式的字符串，每种都有阴影：左对齐字符串（`#drawString`）和居中对齐字符串（`#drawCenteredString`）。它们都接收用于渲染字符串的字体、要绘制的字符串、表示字符串左侧或中点的 x 坐标、顶部的 y 坐标和颜色。

!!! note
    字符串通常应作为 [`Component`s][component] 传入，因为它们可以处理多种用例，包括该方法的另外两个重载版本。

### 纹理

纹理通过 blitting 绘制，因此方法名为 `#blit`，该方法会复制图像的像素并直接绘制到屏幕上。这些调用使用位置纹理着色器。虽然存在许多不同的 `#blit` 重载，但我们只讨论两个静态 `#blit`。

第一个静态 `#blit` 接收六个整数，假定要绘制的纹理位于一个 256 x 256 的 PNG 文件中。它接收屏幕上的左 x 和顶 y 坐标、PNG 内的左 x 和顶 y 坐标，以及要渲染的图像的宽度和高度。

!!! note
    必须指定 PNG 文件的尺寸，以便将坐标归一化为相应的 UV 值。

第一个 `#blit` 调用了的静态 `#blit` 将其扩展为九个整数，仅假定图像位于某个 PNG 文件中。它接收屏幕上的左 x 和顶 y 坐标、z 坐标（称为 blit 偏移）、PNG 内的左 x 和顶 y 坐标、要渲染的图像的宽度和高度，以及 PNG 文件的宽度和高度。

#### Blit 偏移

渲染纹理时的 z 坐标通常设置为 blit 偏移。偏移负责在查看屏幕时正确地对渲染层进行排序。具有较小 z 坐标的渲染会被绘制在背景，反之则绘制在前景。可以通过 `PoseStack` 自身的 `#translate` 直接设置 z 偏移。在 `GuiGraphics` 的某些方法（例如物品渲染）中会内部应用一些基础的偏移逻辑。

!!! important
    在设置 blit 偏移后，必须在渲染对象完成后重置它。否则，屏幕中的其他对象可能会在错误的层次上渲染，导致图形问题。建议在平移前推入当前 pose，完成偏移相关渲染后再弹出。

## 可渲染对象（Renderable）

`Renderable` 本质上是可被渲染的对象，包括屏幕、按钮、聊天框、列表等。`Renderable` 只有一个方法：`#render`。该方法接收用于渲染到屏幕的 `GuiGraphics`、相对于屏幕缩放后的鼠标 x 和 y 位置，以及 tick delta（自上帧以来经过的刻数）。

一些常见的可渲染对象有屏幕和“组件（widgets）”：通常在屏幕上渲染的可交互元素，例如 `Button`、其子类型 `ImageButton`，以及用于在屏幕上输入文本的 `EditBox`。

## GuiEventListener

Minecraft 中渲染的任何屏幕都实现了 `GuiEventListener`。`GuiEventListener` 负责处理与屏幕的用户交互，包括来自鼠标的输入（移动、点击、释放、拖拽、滚动、鼠标悬停）和键盘的输入（按下、释放、字符输入）。每个方法返回该操作是否成功影响了屏幕。像按钮、聊天框、列表等组件也实现了该接口。

### ContainerEventHandler

几乎与 `GuiEventListener` 同义的是它的子类型：`ContainerEventHandler`。它们负责处理包含组件的屏幕上的用户交互，管理当前获得焦点的组件以及如何应用相关交互。`ContainerEventHandler` 添加了三项额外功能：可交互子元素、拖拽和聚焦。

事件处理器保存子元素列表，用于确定元素的交互顺序。在鼠标事件处理（不包括拖拽）期间，列表中第一个鼠标悬停到的子元素会执行其逻辑。

通过鼠标拖拽元素（通过 `#mouseClicked` 和 `#mouseReleased` 实现）可以提供更精确的执行逻辑。

聚焦允许在事件执行期间优先检查并处理特定子元素，例如在键盘事件或鼠标拖拽期间。通常通过 `#setFocused` 设置焦点。此外，可交互子元素可以使用传入的 `FocusNavigationEvent` 通过 `#nextFocusPath` 循环选择。

!!! note
    屏幕通过 `AbstractContainerEventHandler` 实现 `ContainerEventHandler`，该类添加了用于设置和获取拖拽与聚焦子元素的逻辑。

## NarratableEntry

`NarratableEntry` 是可以通过 Minecraft 的无障碍旁白功能朗读的元素。每个元素可以根据悬停或选择状态提供不同的旁白，通常按焦点、悬停然后其他情况的优先级来确定。

`NarratableEntry` 有三个方法：用于确定元素优先级的 (`#narrationPriority`)、用于确定是否应朗读旁白的 (`#isActive`)，以及用于向其输出提供旁白内容（朗读或显示用）的 (`#updateNarration`)。

!!! note
    所有来自 Minecraft 的组件都是 `NarratableEntry`，因此如果使用现有子类型通常无需手动实现它。

## 屏幕子类型

掌握了上述知识后，就可以构建一个基础屏幕。为了更易理解，屏幕的各个组成部分将按通常遇到的顺序说明。

首先，所有屏幕都接收一个表示屏幕标题的 `Component`。该组件通常会由其某个子类绘制。它在基础屏幕中仅用于旁白消息。

```java
// 在某个 Screen 子类中
public MyScreen(Component title) {
    super(title);
}
```

### 初始化

一旦屏幕被初始化，会调用 `#init` 方法。`#init` 方法从 `ItemRenderer` 和 `Minecraft` 实例中设置屏幕内的初始设置，并将相对宽度和高度按游戏的缩放进行计算。任何设置（例如添加组件或预计算相对坐标）都应在此方法中完成。如果游戏窗口被调整大小，屏幕会通过再次调用 `#init` 方法重新初始化。

有三种将组件添加到屏幕的方法，每种用途不同：

|          方法          | 描述                                         |
| :--------------------: | :------------------------------------------- |
|      `#addWidget`      | 添加一个可交互且可朗读的组件，但不渲染。     |
|  `#addRenderableOnly`  | 添加一个仅渲染的组件；它不可交互且不可朗读。 |
| `#addRenderableWidget` | 添加一个既可交互、可朗读又渲染的组件。       |

通常会更频繁使用 `#addRenderableWidget`。

```java
// 在某个 Screen 子类中
@Override
protected void init() {
    super.init();

    // 添加组件和预计算的值
    this.addRenderableWidget(new EditBox(/* ... */));
}
```

### 屏幕的刻拍（Ticking）

屏幕也会使用 `#tick` 方法进行刻拍，以执行与渲染相关的一些客户端逻辑。最常见的例子是 `EditBox` 的闪烁光标。

```java
// 在某个 Screen 子类中
@Override
public void tick() {
    super.tick();

    // 为 editBox 添加刻拍逻辑
    this.editBox.tick();
}
```

### 输入处理

由于屏幕是 `GuiEventListener` 的子类型，可以覆盖输入处理器，例如处理特定 [按键事件][keymapping] 的逻辑。

### 渲染屏幕

最后，屏幕通过作为 `Renderable` 子类型提供的 `#render` 方法进行渲染。如前所述，`#render` 每一帧绘制屏幕需要渲染的所有内容，例如背景、组件、提示等。默认情况下，`#render` 仅渲染组件到屏幕上。

在屏幕中通常不会由子类处理的两件事是背景和提示（tooltips）。

背景可以使用 `#renderBackground` 渲染，有一种方法会在在无法看到背后世界时，为选项背景使用一个 v 偏移来渲染屏幕时的背景。

提示通过 `GuiGraphics#renderTooltip` 或 `GuiGraphics#renderComponentTooltip` 渲染，可接受要渲染的文本组件、可选的自定义提示组件，以及提示应渲染位置的 x / y 相对坐标。

```java
// 在某个 Screen 子类中

// mouseX 和 mouseY 表示鼠标在屏幕上的缩放坐标
@Override
public void render(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
    // 背景通常先渲染
    this.renderBackground(graphics);

    // 在组件之前渲染此处的内容（背景纹理）

    // 如果这是 Screen 的直接子类，则渲染组件
    super.render(graphics, mouseX, mouseY, partialTick);

    // 在组件之后渲染（提示）
}
```

### 关闭屏幕

当屏幕关闭时，有两个方法处理清理：`#onClose` 和 `#removed`。

`#onClose` 在用户触发关闭当前屏幕的输入时调用。此方法通常用作回调以销毁并保存屏幕内部的任何进程，包括向服务器发送数据包。

`#removed` 在屏幕切换并释放给垃圾回收器之前调用。它处理任何在屏幕打开期间尚未恢复为初始状态的内容。

```java
// 在某个 Screen 子类中

@Override
public void onClose() {
    // 在此处停止任何处理器

    // 在最后调用以防止干扰覆盖
    super.onClose();
}

@Override
public void removed() {
    // 在此处重置初始状态

    // 在最后调用以防止干扰覆盖
    super.removed()
;}
```

## `AbstractContainerScreen`

如果某个屏幕直接附加到一个 [menu][menus]，应继承 `AbstractContainerScreen`。`AbstractContainerScreen` 作为菜单的渲染器和输入处理器，并包含用于同步和交互槽位的逻辑。因此，通常只需覆盖或实现两个方法就可以拥有一个可工作的容器屏幕。为便于理解，这里依然按通常遇到的顺序描述容器屏幕的组件。

`AbstractContainerScreen` 通常需要三个参数：打开的容器菜单（用泛型 `T` 表示）、玩家背包（仅用于显示名称）和屏幕的标题。在这里可以设置若干定位字段：

|       字段        | 描述                                                                 |
| :---------------: | :------------------------------------------------------------------- |
|   `imageWidth`    | 背景纹理所用图片的宽度。通常位于 256 x 256 的 PNG 内，默认值为 176。 |
|   `imageHeight`   | 背景纹理所用图片的高度。通常位于 256 x 256 的 PNG 内，默认值为 166。 |
|   `titleLabelX`   | 屏幕标题渲染时的相对 x 坐标。                                        |
|   `titleLabelY`   | 屏幕标题渲染时的相对 y 坐标。                                        |
| `inventoryLabelX` | 玩家背包名称渲染时的相对 x 坐标。                                    |
| `inventoryLabelY` | 玩家背包名称渲染时的相对 y 坐标。                                    |

!!! important
    在前面的章节中，已提到应在 `#init` 方法中设置预计算的相对坐标。这仍然适用，因为这里提到的值不是预计算坐标，而是静态值。

    图片尺寸是静态的且不会改变，因为它们表示背景纹理的大小。为了便于渲染，另有两个附加值（`leftPos` 和 `topPos`）会在 `#init` 方法中预计算，表示背景渲染的左上角位置。标签坐标相对于这些值。

    `leftPos` 和 `topPos` 也常用于渲染背景，因为它们已经表示了传入 `#blit` 方法的位置。

```java
// 在某个 AbstractContainerScreen 子类中
public MyContainerScreen(MyMenu menu, Inventory playerInventory, Component title) {
    super(menu, playerInventory, title);

    this.titleLabelX = 10;
    this.inventoryLabelX = 10;

    /*
     * 如果更改了 'imageHeight'，则必须同时更改 'inventoryLabelY'
     * 因为该值依赖于 'imageHeight' 值。
     */
}
```

### 菜单访问

由于菜单被传入屏幕，菜单中已同步的任何值（通过槽位、数据槽或自定义系统）都可以通过 `menu` 字段访问。

### 容器刻拍

容器屏幕在玩家存活并查看屏幕时会通过 `#containerTick` 在 `#tick` 方法中进行刻拍。它在容器屏幕中取代了 `#tick`，其最常见用途是为配方书执行刻拍。

```java
// 在某个 AbstractContainerScreen 子类中
@Override
protected void containerTick() {
    super.containerTick();

    // 在此处刻拍内容
}
```

### 渲染容器屏幕

容器屏幕通过三个方法进行渲染：`#renderBg`（渲染背景纹理）、`#renderLabels`（在背景上渲染任何文本）以及 `#render`（包含前两者并提供灰色背景和提示）。

从 `#render` 开始，最常见的覆盖（通常也是唯一的情况）是添加背景，调用超类以渲染容器屏幕，然后在其上渲染提示。

```java
// 在某个 AbstractContainerScreen 子类中
@Override
public void render(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
    this.renderBackground(graphics);
    super.render(graphics, mouseX, mouseY, partialTick);

    /*
     * 该方法由容器屏幕添加，用于渲染被悬停槽位的提示。
     */
    this.renderTooltip(graphics, mouseX, mouseY);
}
```

在超类中，会调用 `#renderBg` 来渲染屏幕的背景。最常见的实现使用三个方法调用：两个用于设置，一个用于绘制背景纹理。

```java
// 在某个 AbstractContainerScreen 子类中

// 背景纹理的位置（assets/<namespace>/<path>）
private static final ResourceLocation BACKGROUND_LOCATION = new ResourceLocation(MOD_ID, "textures/gui/container/my_container_screen.png");

@Override
protected void renderBg(GuiGraphics graphics, float partialTick, int mouseX, int mouseY) {
    /*
     * 将背景纹理渲染到屏幕。'leftPos' 和 'topPos' 应该已经表示
     * 纹理应该被渲染的左上角位置，因为它们是在
     * 'imageWidth' 和 'imageHeight' 基础上预先计算得到的。两个零
     * 表示 256 x 256 PNG 文件中的 u/v 整数坐标。
     */
    graphics.blit(BACKGROUND_LOCATION, this.leftPos, this.topPos, 0, 0, this.imageWidth, this.imageHeight);
}
```

最后，`#renderLabels` 被调用来在背景之上但提示之下渲染任何文本。这仅使用字体绘制相关组件。

```java
// 在某个 AbstractContainerScreen 子类中
@Override
protected void renderLabels(GuiGraphics graphics, int mouseX, int mouseY) {
    super.renderLabels(graphics, mouseX, mouseY);

    // 假设我们有一个 Component 'label'
    // 'label' 在 'labelX' 和 'labelY' 被绘制
    graphics.drawString(this.font, this.label, this.labelX, this.labelY, 0x404040);
}
```

!!! note
    在渲染标签时，你**不需要**指定 `leftPos` 和 `topPos` 偏移。这些偏移已在 `PoseStack` 中被平移，因此此方法中的所有绘制都是相对于这些坐标进行的。

## 注册 AbstractContainerScreen

要将 `AbstractContainerScreen` 与菜单配合使用，需要进行注册。可以在 `FMLClientSetupEvent` 的 `FMLClientSetupEvent` 上调用 `MenuScreens#register` 来实现，该事件在 [**mod 事件总线**][modbus] 上触发。

```java
// 事件在 mod 事件总线上监听
private void clientSetup(FMLClientSetupEvent event) {
    event.enqueueWork(
        // 假设 RegistryObject<MenuType<MyMenu>> MY_MENU
        // 假设 MyContainerScreen<MyMenu> 接收三个参数
        () -> MenuScreens.register(MY_MENU.get(), MyContainerScreen::new)
    );
}
```

!!! warning
    `MenuScreens#register` 不是线程安全的，因此需要在并行分发事件提供的 `#enqueueWork` 中调用。

[menus]: ./menus.md
[network]: ../networking/networking.md
[screen]: #the-screen-subtype
[argb]: https://en.wikipedia.org/wiki/RGBA_color_model#ARGB32
[component]: ../concepts/internationalization.md#translatablecontents
[keymapping]: ../misc/keymappings.md#inside-a-gui
[modbus]: ../concepts/events.md#mod-event-bus
