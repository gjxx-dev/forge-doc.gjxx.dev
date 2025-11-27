# 方块实体渲染器（BlockEntityRenderer，简称 BER）

`BlockEntityRenderer`（或简称 BER）用于以静态烘焙模型（JSON、OBJ、B3D 等）无法表达的方式渲染方块。使用 BER 的方块必须有对应的 `BlockEntity`。

创建 BER
---------

要创建 BER，请新建一个继承自 `BlockEntityRenderer` 的类，泛型参数指定对应的 `BlockEntity` 类。该泛型参数会在 BER 的 `render` 方法中使用。

每个 `BlockEntityType` 只对应一个 BER。因此，属于某个方块实体实例的特定值应存储在传入渲染器的 `BlockEntity` 中，而不是存储在 BER 自身。例如：如果将每帧递增的整数保存在 BER 中，那么游戏中该类型的每个方块实体都会在每帧递增该值，这通常不是想要的行为。

### `render`

该方法在每帧被调用用于渲染方块实体。

#### 参数
- `blockEntity`：要渲染的方块实体实例。
- `partialTick`：自上一个完整刻（tick）以来经过的时间，以刻的分数表示。
- `poseStack`：一个矩阵堆栈（Pose Stack），包含相对于方块实体当前位置的四维变换矩阵。
- `bufferSource`：渲染缓冲区，可取得顶点消费者（vertex consumer）。
- `combinedLight`：表示方块实体当前光照值的整数。
- `combinedOverlay`：当前叠加层（overlay）的整数值，通常为 `OverlayTexture#NO_OVERLAY` 或 655360。


注册 BER
--------

要注册 BER，需要在模组事件总线上订阅 `EntityRenderersEvent$RegisterRenderers` 事件并调用 `#registerBlockEntityRenderer`。
