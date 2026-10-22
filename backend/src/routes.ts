import { Router } from "express";
import { upload } from "./config/multer";
import { isAuthenticated } from "./middlewares/isAuthenticated";
import { validate } from "./middlewares/validate";
import {
  addItemSchema,
  authUserSchema,
  createCategorySchema,
  createOrderSchema,
  createProductSchema,
  createUserSchema,
  itemIdSchema,
  listByCategorySchema,
  orderIdSchema,
} from "./schemas";
import { UserController } from "./controllers/UserController";
import { CategoryController } from "./controllers/CategoryController";
import { ProductController } from "./controllers/ProductController";
import { OrderController } from "./controllers/OrderController";

const router = Router();

const user = new UserController();
const category = new CategoryController();
const product = new ProductController();
const order = new OrderController();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// ---------- Usuário ----------
router.post("/users", validate(createUserSchema), user.create);
router.post("/session", validate(authUserSchema), user.auth);
router.get("/me", isAuthenticated, user.me);

// ---------- Categoria ----------
router.post("/category", isAuthenticated, validate(createCategorySchema), category.create);
router.get("/category", isAuthenticated, category.list);

// ---------- Produto ----------
// upload.single precisa vir antes do validate: é ele que preenche req.body no multipart
router.post(
  "/product",
  isAuthenticated,
  upload.single("file"),
  validate(createProductSchema),
  product.create,
);
router.get(
  "/category/product",
  isAuthenticated,
  validate(listByCategorySchema, "query"),
  product.listByCategory,
);

// ---------- Pedido ----------
router.post("/order", isAuthenticated, validate(createOrderSchema), order.create);
router.delete("/order", isAuthenticated, validate(orderIdSchema, "query"), order.remove);

router.post("/order/add", isAuthenticated, validate(addItemSchema), order.addItem);
router.delete("/order/remove", isAuthenticated, validate(itemIdSchema, "query"), order.removeItem);

router.put("/order/send", isAuthenticated, validate(orderIdSchema), order.send);
router.get("/orders", isAuthenticated, order.list);
router.get("/order/active", isAuthenticated, order.listActive);
router.get("/order/detail", isAuthenticated, validate(orderIdSchema, "query"), order.detail);
router.put("/order/finish", isAuthenticated, validate(orderIdSchema), order.finish);
router.patch("/order/close", isAuthenticated, validate(orderIdSchema), order.close);

export { router };
