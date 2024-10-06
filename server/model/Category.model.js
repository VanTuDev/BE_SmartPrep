import mongoose from 'mongoose';

// Define the schema for categories
const CategorySchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, "Please provide the category name"],
   },
   description: {
      type: String,
      required: [true, "Please provide a description for the category"],
   },
   created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to User model
      required: true,
   },
}, {
   timestamps: true, // Automatically add createdAt and updatedAt fields
});

// Check if model exists
const CategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);

export default CategoryModel;
