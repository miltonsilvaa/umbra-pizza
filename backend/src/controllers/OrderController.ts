import type { Request, Response } from "express";
import { CreateOrderService } from "../services/order/CreateOrderService";
import { RemoveOrderService } from "../services/order/RemoveOrderService";
import { AddItemService } from "../services/order/AddItemService";
import { RemoveItemService } from "../services/order/RemoveItemService";
import { SendOrderService } from "../services/order/SendOrderService";
import { ListOrdersService } from "../services/order/ListOrdersService";
import { DetailOrderService } from "../services/order/DetailOrderService";
import { FinishOrderService } from "../services/order/FinishOrderService";

export class OrderController {
  async create(_req: Request, res: Response) {
    const order = await new CreateOrderService().execute(res.locals.data);
    return res.status(201).json(order);
  }

  async remove(_req: Request, res: Response) {
    const order = await new RemoveOrderService().execute(res.locals.data.order_id);
    return res.json(order);
  }

  async addItem(_req: Request, res: Response) {
    const item = await new AddItemService().execute(res.locals.data);
    return res.status(201).json(item);
  }

  async removeItem(_req: Request, res: Response) {
    const item = await new RemoveItemService().execute(res.locals.data.item_id);
    return res.json(item);
  }

  async send(_req: Request, res: Response) {
    const order = await new SendOrderService().execute(res.locals.data.order_id);
    return res.json(order);
  }

  async list(_req: Request, res: Response) {
    const orders = await new ListOrdersService().execute();
    return res.json(orders);
  }

  async detail(_req: Request, res: Response) {
    const order = await new DetailOrderService().execute(res.locals.data.order_id);
    return res.json(order);
  }

  async finish(_req: Request, res: Response) {
    const order = await new FinishOrderService().execute(res.locals.data.order_id);
    return res.json(order);
  }
}
