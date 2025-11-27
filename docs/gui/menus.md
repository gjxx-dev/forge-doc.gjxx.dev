# 菜单（Menus）

菜单是图形用户界面（GUI）后端的一类组件，负责处理与某个“数据持有器”（data holder）交互的逻辑。菜单本身不存储数据；它们是视图（view），允许用户间接修改数据持有器的内部状态。因此，不应将数据持有器直接耦合到某个菜单实现，而应通过传入对数据的引用来操作。

## `MenuType`

菜单在运行时动态创建与销毁，因此它们自身并不是注册表对象。为便于创建和引用菜单的“类型”，会注册与之对应的工厂对象 —— `MenuType`。

`MenuType` 通过接收一个 `MenuSupplier` 和一个 `FeatureFlagSet` 来构造。`MenuSupplier` 是一个函数：它接受容器 id 和正在查看该菜单的玩家的物品栏（`Inventory`），并返回新创建的 [`AbstractContainerMenu`][acm] 实例。

```java
// 对于某个 DeferredRegister<MenuType<?>> REGISTER
public static final RegistryObject<MenuType<MyMenu>> MY_MENU = REGISTER.register("my_menu", () -> new MenuType(MyMenu::new, FeatureFlags.DEFAULT_FLAGS));

// 在 MyMenu（AbstractContainerMenu 的子类）中
public MyMenu(int containerId, Inventory playerInv) {
  super(MY_MENU.get(), containerId);
  // ...
}
```

!!! note
    容器标识符（container id）在单个玩家内是唯一的。这意味着相同的容器 id 在两个不同玩家上表示两个独立的菜单实例，即使它们查看的是同一数据持有器。

客户端上的 `MenuSupplier` 通常会创建一个带有占位数据引用的菜单实例，用以显示并与来自服务端的数据持有器同步的数据交互。

### `IContainerFactory`

如果客户端在创建菜单时需要来自服务端的额外信息（例如世界中数据持有器的位置），可使用 `IContainerFactory` 接口。除了容器 id 和玩家物品栏外，`IContainerFactory` 还携带一个 `FriendlyByteBuf`，用于传输从服务端发送来的额外数据。可通过 `IForgeMenuType.create` 使用 `IContainerFactory` 来创建 `MenuType`。

```java
// 对于某个 DeferredRegister<MenuType<?>> REGISTER
public static final RegistryObject<MenuType<MyMenuExtra>> MY_MENU_EXTRA = REGISTER.register("my_menu_extra", () -> IForgeMenuType.create(MyMenu::new));

// 在 MyMenuExtra（AbstractContainerMenu 的子类）中
public MyMenuExtra(int containerId, Inventory playerInv, FriendlyByteBuf extraData) {
  super(MY_MENU_EXTRA.get(), containerId);
  // 存储来自缓冲区的额外数据
  // ...
}
```

## `AbstractContainerMenu`

所有菜单都继承自 `AbstractContainerMenu`。菜单的构造器通常接受两项参数：表示菜单类型的 [`MenuType`][mt] 和表示菜单在当前访问者上下文中的容器 id。

!!! important
    单个玩家最多可以同时打开 100 个不同的菜单实例。

每个菜单类应提供两个构造函数：一个用于在服务端初始化菜单、一个用于在客户端初始化菜单。用于客户端的构造函数是传递给 `MenuType` 的那个；服务端构造函数中存在的字段在客户端构造函数中应当提供合理的默认值。

```java
// 客户端菜单构造函数
public MyMenu(int containerId, Inventory playerInventory) {
  this(containerId, playerInventory);
}

// 服务端菜单构造函数
public MyMenu(int containerId, Inventory playerInventory) {
  // ...
}
```

每个菜单实现必须实现两个方法：`#stillValid` 和 [`#quickMoveStack`][qms]。

### `#stillValid` 与 `ContainerLevelAccess`

`#stillValid` 用于判断某个玩家是否仍应保持该菜单打开。通常会委托给静态的 `stillValid` 工具方法，该方法接受一个 `ContainerLevelAccess`、玩家实例和该菜单关联的 `Block` 作为参数。客户端的菜单实现应始终返回 `true`（静态实现默认如此）。静态实现会检查玩家是否在数据存放位置 8 个方块以内。

`ContainerLevelAccess` 在一个封闭作用域内提供当前的世界（level）与位置。在服务端构造菜单时，可以使用 `ContainerLevelAccess.create` 创建该访问对象；客户端的菜单构造函数可以传入 `ContainerLevelAccess.NULL`，该值为无操作实现。

```java
// 客户端菜单构造函数
public MyMenuAccess(int containerId, Inventory playerInventory) {
  this(containerId, playerInventory, ContainerLevelAccess.NULL);
}

// 服务端菜单构造函数
public MyMenuAccess(int containerId, Inventory playerInventory, ContainerLevelAccess access) {
  // ...
}

// 假设该菜单绑定到 RegistryObject<Block> MY_BLOCK
@Override
public boolean stillValid(Player player) {
  return AbstractContainerMenu.stillValid(this.access, player, MY_BLOCK.get());
}
```

### 数据同步

某些数据需要在服务端和客户端均可用以便展示。菜单实现了一层基础的数据同步机制：当当前数据与上次同步到客户端的数据不一致时，会触发同步；对玩家来说，该检查每 tick 执行一次。

Minecraft 默认提供两种同步方式：通过 `Slot` 同步 `ItemStack`，以及通过 `DataSlot` 同步整数。`Slot` 与 `DataSlot` 是对底层数据的视图（view），在操作合法的前提下，玩家可以在界面内修改这些数据。可在菜单的构造函数中通过 `#addSlot` 与 `#addDataSlot` 添加这些视图。

!!! note
    由于原生的 `Container` 在 Forge 中已被弃用，推荐使用能力接口 `IItemHandler`（对应的槽位实现为 `SlotItemHandler`），下面的示例以能力变体为主。

`SlotItemHandler` 接受四个参数：代表物品集合的 `IItemHandler`、该槽在容器中的索引，以及该槽在屏幕上相对于 `AbstractContainerScreen#leftPos` 与 `#topPos` 的 x、y 坐标。客户端构造函数应提供同样大小的空库存实例作为占位。

通常的添加顺序为：先添加菜单自身的槽位（数据槽），然后添加玩家的主库存，最后添加玩家的快捷栏。要访问菜单中的某个 `Slot`，需根据添加槽位的顺序计算其索引。

`DataSlot` 是一个抽象类，需实现 getter 与 setter 来引用数据存储对象。客户端构造函数可通过 `DataSlot.standalone()` 提供独立实例。

这些槽位与视图应在每次初始化新菜单时重新创建。

!!! warning
    虽然 `DataSlot` 存储的是整数，但在网络传输时其有效范围被限制为一个短整型（-32768 到 32767），高 16 位会被忽略。

```java
// 假设数据对象的库存大小为 5
// 客户端菜单构造函数
public MyMenuAccess(int containerId, Inventory playerInventory) {
  this(containerId, playerInventory, new ItemStackHandler(5), DataSlot.standalone());
}

// 服务端菜单构造函数
public MyMenuAccess(int containerId, Inventory playerInventory, IItemHandler dataInventory, DataSlot dataSingle) {
  // 检查数据库存大小并添加数据槽
  this.addSlot(new SlotItemHandler(dataInventory, /*...*/));

  // 添加玩家物品栏槽位
  this.addSlot(new Slot(playerInventory, /*...*/));

  // 添加单个数据槽
  this.addDataSlot(dataSingle);

  // ...
}
```

#### `ContainerData`

如果需要同步多个整数，可以使用 `ContainerData` 接口。该接口提供索引查找方式：每个索引对应一个不同的整数。若通过 `#addDataSlots` 将 `ContainerData` 添加到菜单中，会为其中的每个整数创建对应的 `DataSlot`。客户端构造函数应通过 `SimpleContainerData` 提供新实例。

```java
// 假设 ContainerData 大小为 3
// 客户端菜单构造函数
public MyMenuAccess(int containerId, Inventory playerInventory) {
  this(containerId, playerInventory, new SimpleContainerData(3));
}

// 服务端菜单构造函数
public MyMenuAccess(int containerId, Inventory playerInventory, ContainerData dataMultiple) {
  checkContainerDataCount(dataMultiple, 3);

  // 为每个整数添加 DataSlot
  this.addDataSlots(dataMultiple);

  // ...
}
```

!!! warning
    由于 `ContainerData` 基于 `DataSlot`，因此其整数值也受短整型范围限制（-32768 到 32767）。

#### `#quickMoveStack`

`#quickMoveStack` 是菜单必须实现的第二个方法。当玩家对某个槽位执行 Shift-点击（快捷移动）操作时会调用该方法，方法会尝试将该槽位的物品移动到特定目标区域，直到源槽为空或无法继续移动为止。该方法应返回被移动槽位中物品的拷贝。

常见实现会使用 `#moveItemStackTo` 按照指定顺序将物品转移到目标槽区。该方法接收要移动的物品、尝试的起始槽索引（包含）、结束槽索引（不包含），以及是否从后向前遍历槽位的布尔标志。

下面是一个较为常见的逻辑示例（保留原文中的实现思路）：

```java
// 假设数据库存大小为 5
// 数据库存的槽位分布：结果（0）、输入（1 - 4）
// 玩家主库存（5 - 31）
// 玩家快捷栏（32 - 40）
@Override
public ItemStack quickMoveStack(Player player, int quickMovedSlotIndex) {
  ItemStack quickMovedStack = ItemStack.EMPTY;
  Slot quickMovedSlot = this.slots.get(quickMovedSlotIndex);

  if (quickMovedSlot != null && quickMovedSlot.hasItem()) {
    ItemStack rawStack = quickMovedSlot.getItem();
    quickMovedStack = rawStack.copy();

    // 若来自结果槽，尝试移动到玩家库存/快捷栏
    if (quickMovedSlotIndex == 0) {
      if (!this.moveItemStackTo(rawStack, 5, 41, true)) {
        return ItemStack.EMPTY;
      }
      quickMovedSlot.onQuickCraft(rawStack, quickMovedStack);
    }
    // 若来自玩家主库存或快捷栏，尝试移动到数据库存输入槽
    else if (quickMovedSlotIndex >= 5 && quickMovedSlotIndex < 41) {
      if (!this.moveItemStackTo(rawStack, 1, 5, false)) {
        if (quickMovedSlotIndex < 32) {
          if (!this.moveItemStackTo(rawStack, 32, 41, false)) {
            return ItemStack.EMPTY;
          }
        } else if (!this.moveItemStackTo(rawStack, 5, 32, false)) {
          return ItemStack.EMPTY;
        }
      }
    }
    // 否则尝试移动到玩家库存/快捷栏
    else if (!this.moveItemStackTo(rawStack, 5, 41, false)) {
      return ItemStack.EMPTY;
    }

    if (rawStack.isEmpty()) {
      quickMovedSlot.set(ItemStack.EMPTY);
    } else {
      quickMovedSlot.setChanged();
    }

    if (rawStack.getCount() == quickMovedStack.getCount()) {
      return ItemStack.EMPTY;
    }

    quickMovedSlot.onTake(player, rawStack);
  }

  return quickMovedStack;
}
```

## 打开菜单

当菜单类型已注册、菜单实现完成且已绑定一个 [screen] 后，玩家即可打开该菜单。服务器端可通过 `ServerPlayer#openMenu` 打开菜单，传入服务端菜单的 `MenuProvider`，并在需要时传入 `FriendlyByteBuf` 以同步额外数据到客户端。

!!! note
    仅当菜单类型是通过 [`IContainerFactory`][icf] 创建时，才应使用带 `FriendlyByteBuf` 的 `ServerPlayer#openMenu`。

#### `MenuProvider`

`MenuProvider` 是一个接口，包含两个方法：`#createMenu`（创建服务端的菜单实例）与 `#getDisplayName`（返回传递给屏幕的菜单标题组件）。`#createMenu` 接收容器 id、打开菜单的玩家的物品栏以及打开菜单的玩家实例。

可以使用 `SimpleMenuProvider` 便捷创建 `MenuProvider`，传入创建服务器端菜单的方法引用与菜单标题。

```java
// 在某个实现中
serverPlayer.openMenu(new SimpleMenuProvider(
  (containerId, playerInventory, player) -> new MyMenu(containerId, playerInventory),
  Component.translatable("menu.title.examplemod.mymenu")
));
```

### 常见实现

菜单通常在玩家交互（例如右键方块或实体）时打开。

#### 方块实现

方块通常通过重写 `BlockBehaviour#use` 来打开菜单。在逻辑客户端上，该交互应返回 `InteractionResult#SUCCESS`；在服务器端则应打开菜单并返回 `InteractionResult#CONSUME`。

`MenuProvider` 可通过重写 `BlockBehaviour#getMenuProvider` 提供。原版方法允许以旁观者模式查看菜单。

```java
@Override
public MenuProvider getMenuProvider(BlockState state, Level level, BlockPos pos) {
  return new SimpleMenuProvider(/* ... */);
}

@Override
public InteractionResult use(BlockState state, Level level, BlockPos pos, Player player, InteractionHand hand, BlockHitResult result) {
  if (!level.isClientSide && player instanceof ServerPlayer serverPlayer) {
    serverPlayer.openMenu(state.getMenuProvider(level, pos));
  }
  return InteractionResult.sidedSuccess(level.isClientSide);
}
```

!!! note
    这是实现该逻辑的最简单方式，但并非唯一方式。如果希望方块仅在特定条件下打开菜单，则需在打开前先同步一些数据到客户端，以便返回 `InteractionResult#PASS` 或 `#FAIL`。

#### 生物实现

生物通常通过重写 `Mob#mobInteract` 来实现打开菜单。实现方式与方块类似，区别在于生物自身应实现 `MenuProvider`，以支持旁观者模式查看。

```java
public class MyMob extends Mob implements MenuProvider {
  // ...

  @Override
  public InteractionResult mobInteract(Player player, InteractionHand hand) {
    if (!this.level.isClientSide && player instanceof ServerPlayer serverPlayer) {
      serverPlayer.openMenu(this);
    }
    return InteractionResult.sidedSuccess(this.level.isClientSide);
  }
}
```

!!! note
    上述示例为最简单的实现方式，实际项目中可根据需要采用更复杂的逻辑。

[registered]: ../concepts/registries.md#methods-for-registering
[acm]: #abstractcontainermenu
[mt]: #menutype
[qms]: #quickmovestack
[cap]: ../datastorage/capabilities.md#forge-provided-capabilities
[screen]: ./screens.md
[icf]: #icontainerfactory

```
    // 若槽位存在且非空
    if (quickMovedSlot != null && quickMovedSlot.hasItem()) {
      // 原始要移动的物品
      ItemStack rawStack = quickMovedSlot.getItem();
      // 保存拷贝作为返回值
      quickMovedStack = rawStack.copy();

      /*
      以下逻辑通常按容器类型简化：
      - 若来自数据库存（例如结果槽），尝试移动到玩家库存/快捷栏；
      - 若来自玩家库存/快捷栏，则尝试移动到数据库存的输入槽；
      - 对于不可转换数据的容器（例如箱子），逻辑更简单。
      */

      // 若被快速移动的槽位是结果槽
      if (quickMovedSlotIndex == 0) {
        // 尝试把结果移动到玩家库存/快捷栏
        if (!this.moveItemStackTo(rawStack, 5, 41, true)) {
          // 无法移动则放弃快捷移动
          return ItemStack.EMPTY;
        }

        // 对结果槽执行快速合成相关逻辑（示例）
        quickMovedSlot.onQuickCraft(rawStack, quickMovedStack);
      }
      // 若被快速移动的槽位位于玩家主库存或快捷栏
      else if (quickMovedSlotIndex >= 5 && quickMovedSlotIndex < 41) {
        // 尝试把玩家槽移动到数据库存输入槽
        if (!this.moveItemStackTo(rawStack, 1, 5, false)) {
          // 若在玩家主库存且未能移动，尝试把主库存的物品移动到快捷栏
          if (quickMovedSlotIndex < 32) {
            if (!this.moveItemStackTo(rawStack, 32, 41, false)) {
              return ItemStack.EMPTY;
            }
          }
          // 否则尝试把快捷栏移动回主库存
          else if (!this.moveItemStackTo(rawStack, 5, 32, false)) {
            return ItemStack.EMPTY;
          }
        }
      }
      // 若来自数据库存的输入槽，则尝试移动到玩家库存/快捷栏
      else if (!this.moveItemStackTo(rawStack, 5, 41, false)) {
        return ItemStack.EMPTY;
      }

      if (rawStack.isEmpty()) {
        // 若物品已完全移动，设置槽为空
        quickMovedSlot.set(ItemStack.EMPTY);
      } else {
        // 否则通知槽内容已更改
        quickMovedSlot.setChanged();
      }

      /*
      对于能转换物品的容器（如合成类容器），以下逻辑可用于处理剩余物品的后续处理。
      若未能移动任何物品（数量未变化），则取消快捷移动。
      */
      if (rawStack.getCount() == quickMovedStack.getCount()) {
        return ItemStack.EMPTY;
      }
      // 执行与取出物品相关的后置逻辑
      quickMovedSlot.onTake(player, rawStack);
    }

    return quickMovedStack;
  }
  ```

  ## 打开菜单

  当菜单类型已注册、菜单实现完成并为其关联了一个 [screen] 时，玩家即可打开该菜单。服务端可通过 `ServerPlayer#openMenu` 打开菜单，该方法接收服务器端菜单的 `MenuProvider`，并可选传入 `FriendlyByteBuf` 以将附加数据同步到客户端。

  !!! note
      仅当菜单类型通过 `IContainerFactory` 创建时，才应在调用带 `FriendlyByteBuf` 的 `ServerPlayer#openMenu` 时传入缓冲区。

  #### `MenuProvider`

  `MenuProvider` 是一个接口，定义两个方法：`#createMenu`（创建服务端菜单实例）与 `#getDisplayName`（返回用于传递给屏幕的菜单标题组件）。`#createMenu` 接收容器 id、打开菜单玩家的物品栏以及打开菜单的玩家实例。

  可以使用 `SimpleMenuProvider` 方便地创建一个 `MenuProvider`，传入一个用于创建服务端菜单的方法引用和一个标题组件。

  ```java
  // 在某处实现中打开菜单
  serverPlayer.openMenu(new SimpleMenuProvider(
    (containerId, playerInventory, player) -> new MyMenu(containerId, playerInventory),
    Component.translatable("menu.title.examplemod.mymenu")
  ));
  ```

  ### 常见实现方式

  菜单通常在玩家交互时打开，例如右键方块或实体。

  #### 方块实现

  方块通常通过重写 `BlockBehaviour#use` 来实现打开菜单。在客户端交互时返回 `InteractionResult#SUCCESS`；在服务端上则调用 `openMenu` 并返回 `InteractionResult#CONSUME`。

  `MenuProvider` 通常通过重写 `BlockBehaviour#getMenuProvider` 来提供。原版实现允许旁观者模式下查看菜单。

  ```java
  // 在某个方块子类中
  @Override
  public MenuProvider getMenuProvider(BlockState state, Level level, BlockPos pos) {
    return new SimpleMenuProvider(/* ... */);
  }

  @Override
  public InteractionResult use(BlockState state, Level level, BlockPos pos, Player player, InteractionHand hand, BlockHitResult result) {
    if (!level.isClientSide && player instanceof ServerPlayer serverPlayer) {
      serverPlayer.openMenu(state.getMenuProvider(level, pos));
    }
    return InteractionResult.sidedSuccess(level.isClientSide);
  }
  ```

  !!! note
      这是实现逻辑的最简单示例，非唯一方法。如果你希望方块在特定条件下才打开菜单，需要在打开前将必要数据同步到客户端以便返回 `InteractionResult#PASS` 或 `#FAIL`。

  #### 生物实现

  生物通常通过重写 `Mob#mobInteract` 来打开菜单。实现方式与方块类似，唯一不同的是生物本身应实现 `MenuProvider`，以便旁观者模式也能查看菜单。

  ```java
  public class MyMob extends Mob implements MenuProvider {
    // ...

    @Override
    public InteractionResult mobInteract(Player player, InteractionHand hand) {
      if (!this.level.isClientSide && player instanceof ServerPlayer serverPlayer) {
        serverPlayer.openMenu(this);
      }
      return InteractionResult.sidedSuccess(this.level.isClientSide);
    }
  }
  ```

  [registered]: ../concepts/registries.md#methods-for-registering
  [acm]: #abstractcontainermenu
  [mt]: #menutype
  [qms]: #quickmovestack
  [cap]: ../datastorage/capabilities.md#forge-provided-capabilities
  [screen]: ./screens.md
  [icf]: #icontainerfactory
