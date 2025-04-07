// import { Router } from 'express';
// import container from '@/configs/container.config.ts';
// import { AlbumController } from '@/controllers/album.controller';
// import { TYPES } from '@/constants/types.ts';
// import roleRequire from '@/configs/middleware.config';
// const router = Router();
// const albumController = container.get<AlbumController>(
// 	TYPES.AlbumController
// );
// router.post('/', roleRequire(), albumController.add);
// router.get('/', roleRequire(), albumController.getByUserId);
// router.get('/other', roleRequire(), albumController.getByOtherUserId);
// router.get('/:id', roleRequire(), albumController.getById);
// router.put('/:id', roleRequire(), albumController.update);
// router.delete('/delete-art/:id', roleRequire(), albumController.delArt);
// router.delete('/delete-collection/:id', roleRequire(), albumController.delCollection);
// export default router;
