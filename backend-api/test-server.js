import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

console.log('🔄 Testing MongoDB connection...');
console.log('URI:', process.env.MONGODB_URI?.substring(0, 40) + '...');

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose.connect(process.env.MONGODB_URI, options)
  .then((conn) => {
    console.log('✅ MongoDB Connected:', conn.connection.host);
    console.log('📊 Database:', conn.connection.name);
    
    // List collections
    mongoose.connection.db.listCollections().toArray()
      .then(collections => {
        console.log('\n📁 Collections in database:');
        collections.forEach(col => console.log('  -', col.name));
        
        // Check if attendances collection exists
        const hasAttendances = collections.some(c => c.name === 'attendances');
        console.log('\n✅ Attendances collection exists:', hasAttendances);
        
        process.exit(0);
      });
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
