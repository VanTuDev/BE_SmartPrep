import cron from 'node-cron';
import TestModel from '../model/Test.model.js';

// Cập nhật status bài kiểm tra mỗi 5 phút
cron.schedule('*/5 * * * *', async () => {
   console.log('Kiểm tra và cập nhật status bài kiểm tra...');

   const currentDate = new Date();

   const tests = await TestModel.find({
      status: { $in: ['published', 'start'] }
   });

   for (const test of tests) {
      if (currentDate >= test.start_date && currentDate <= test.end_date && test.status !== 'start') {
         test.status = 'start';
      } else if (currentDate > test.end_date && test.status !== 'end') {
         test.status = 'end';
      }

      await test.save();
   }

   console.log('Đã cập nhật status các bài kiểm tra.');
});
