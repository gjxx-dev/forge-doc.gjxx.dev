# 按键绑定

按键绑定（Key Mapping）定义了应与某个输入（鼠标点击、按键等）关联的特定动作。客户端在可以接收输入的任何时刻都可以检测这些绑定。除此之外，每个按键绑定都可以在“控制”选项菜单中被分配到任意输入设备上。

## 注册 `KeyMapping`

`KeyMapping` 应在物理客户端上监听 `RegisterKeyMappingsEvent`（仅在**mod 事件总线**上）并调用 `#register` 来注册：

```java
// 在某个仅限物理客户端的类中

// KeyMapping 使用惰性初始化，直到注册之前不会被创建
public static final Lazy<KeyMapping> EXAMPLE_MAPPING = Lazy.of(() -> /*...*/);

// 该事件仅在物理客户端的 mod 事件总线上触发
@SubscribeEvent
public void registerBindings(RegisterKeyMappingsEvent event) {
  event.register(EXAMPLE_MAPPING.get());
}
```

## 创建 `KeyMapping`

可以直接使用构造函数创建 `KeyMapping`。构造函数需要一个用于本地化的[翻译键][tk]来定义映射名称、映射的默认输入，以及一个用于在“控制”选项菜单中分组的[翻译键][tk]（类别）。

!!! tip
    可以通过提供包含模组 id 的自定义类别翻译键（例如 `key.categories.examplemod.examplecategory`）将按键添加到自定义类别中。

### 默认输入

每个按键绑定都有一个默认输入，这由 `InputConstants$Key` 提供。每个输入由一个 `InputConstants$Type`（定义输入设备）和一个整数（表示设备上对应的标识符）组成。

Vanilla 提供三种输入类型：`KEYSYM`（通过 GLFW 的按键标记定义键盘按键）、`SCANCODE`（平台相关的扫描码）和 `MOUSE`（鼠标）。

!!! note
    强烈建议对于键盘使用 `KEYSYM` 而非 `SCANCODE`，因为 GLFW 的按键标记不依赖于具体平台。更多信息请参见 [GLFW 文档][keyinput]。

整数值依赖于提供的类型。所有输入代码在 `GLFW` 中定义：`KEYSYM` 令牌以 `GLFW_KEY_*` 前缀，鼠标代码以 `GLFW_MOUSE_*` 前缀。

```java
new KeyMapping(
  "key.examplemod.example1", // 使用该翻译键进行本地化
  InputConstants.Type.KEYSYM, // 默认映射为键盘输入
  GLFW.GLFW_KEY_P, // 默认键为 P
  "key.categories.misc" // 映射位于 misc 类别下
)
```

!!! note
    若按键映射不应绑定默认输入，则应将输入设置为 `InputConstants#UNKNOWN`。Vanilla 构造函数要求你通过 `InputConstants$Key#getValue` 提取输入代码，而 Forge 的构造函数可以直接传入原始输入字段。

### `IKeyConflictContext`

并非所有按键绑定在任何上下文都有效。有些只在 GUI 中使用，而有些仅在游戏中使用。为避免不同上下文中相同按键的冲突，可为按键绑定指定一个 `IKeyConflictContext`。

每个冲突上下文包含两个方法：`#isActive`（定义映射是否可在当前游戏状态中使用）和 `#conflicts`（定义其是否与同一或不同冲突上下文中的某个按键冲突）。

Forge 目前通过 `KeyConflictContext` 定义了三种基本上下文：`UNIVERSAL`（默认，表示按键在所有上下文有效）、`GUI`（仅在打开 `Screen` 时有效）、`IN_GAME`（仅在未打开 `Screen` 时有效）。可以通过实现 `IKeyConflictContext` 来创建新的冲突上下文。

```java
new KeyMapping(
  "key.examplemod.example2",
  KeyConflictContext.GUI, // 仅在打开界面时可用
  InputConstants.Type.MOUSE, // 默认映射为鼠标
  GLFW.GLFW_MOUSE_BUTTON_LEFT, // 默认鼠标按钮为左键
  "key.categories.examplemod.examplecategory" // 属于新类别
)
```

### `KeyModifier`

有时模组开发者希望在按下修饰键时按键绑定表现不同（例如 `G` 与 `CTRL + G`）。为此，Forge 在构造函数中增加了一个 `KeyModifier` 参数，用于指定控制键（`KeyModifier#CONTROL`）、Shift（`KeyModifier#SHIFT`）或 Alt（`KeyModifier#ALT`）。`KeyModifier#NONE` 为默认值，表示没有修饰键。

在“控制”选项菜单中可通过按住修饰键再点击目标输入来为映射添加修饰键。

```java
new KeyMapping(
  "key.examplemod.example3",
  KeyConflictContext.UNIVERSAL,
  KeyModifier.SHIFT, // 默认需要按住 Shift
  InputConstants.Type.KEYSYM, // 默认为键盘输入
  GLFW.GLFW_KEY_G, // 默认键为 G
  "key.categories.misc"
)
```

## 检测 `KeyMapping`

可以检查 `KeyMapping` 是否被触发，并在合适时执行相应逻辑。

### 在游戏内

在游戏内，应在物理客户端的 **Forge 事件总线** 上监听 `ClientTickEvent`，并在循环内调用 `KeyMapping#consumeClick`。`#consumeClick` 只会返回发生且尚未被处理的点击次数，因此不会导致无限阻塞。

```java
// 该事件在物理客户端的 Forge 事件总线上触发
public void onClientTick(ClientTickEvent event) {
  if (event.phase == TickEvent.Phase.END) { // 每个 tick 会触发两次，该处只在结束时运行一次
    while (EXAMPLE_MAPPING.get().consumeClick()) {
      // 在此执行按键触发逻辑
    }
  }
}
```

!!! warning
    不要使用 `InputEvent` 系列事件替代 `ClientTickEvent`，因为键盘与鼠标输入有各自的事件，仅能处理对应设备的输入。

### 在 GUI 内

在 GUI（界面）内，可以在 `GuiEventListener` 的方法中使用 `IForgeKeyMapping#isActiveAndMatches` 检查按键。最常用的方法是 `#keyPressed` 与 `#mouseClicked`。

`#keyPressed` 接收 GLFW 键码、平台相关扫描码和修饰键位的位域（bitfield）。可以通过 `InputConstants#getKey` 构造输入来与按键映射进行比较。映射方法会自行检查修饰键。

```java
// 在某个 Screen 子类中
@Override
public boolean keyPressed(int key, int scancode, int mods) {
  if (EXAMPLE_MAPPING.get().isActiveAndMatches(InputConstants.getKey(key, scancode))) {
    // 在此处理按键逻辑
    return true;
  }
  return super.keyPressed(x, y, button);
}
```

!!! note
    如果你不是该屏幕的所有者，想检测某个 **键盘** 的按键，可以在 Forge 事件总线上监听 `ScreenEvent$KeyPressed` 的 Pre 或 Post 事件。

`#mouseClicked` 接收鼠标 x、y 坐标与按键编号。可以通过 `InputConstants$Type#getOrCreate` 与 `MOUSE` 类型来构造鼠标输入并与映射比较。

```java
// 在某个 Screen 子类中
@Override
public boolean mouseClicked(double x, double y, int button) {
  if (EXAMPLE_MAPPING.get().isActiveAndMatches(InputConstants.TYPE.MOUSE.getOrCreate(button))) {
    // 在此处理鼠标点击逻辑
    return true;
  }
  return super.mouseClicked(x, y, button);
}
```

!!! note
    如果你不是该屏幕的所有者，想检测某个 **鼠标** 的点击，可以在 Forge 事件总线上监听 `ScreenEvent$MouseButtonPressed` 的 Pre 或 Post 事件。

[modbus]: ../concepts/events.md#mod-event-bus
[controls]: https://minecraft.wiki/w/Options#Controls
[tk]: ../concepts/internationalization.md#translatablecontents
[keyinput]: https://www.glfw.org/docs/3.3/input_guide.html#input_key
[forgebus]: ../concepts/events.md#creating-an-event-handler

