const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DateTime } = require('luxon');

const GameSchema = new Schema({
  title: { type: String, required: true, minlength: 1 },
  summary: { type: String, required: true, minlength: 1 },
  company: { type: String, required: true, minlength: 1 },
  category: [{ type: Schema.Types.ObjectId, ref: 'Category', required: true }],
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  release_date: { type: Date, default: '' },
  cover_img: { type: String, default: '../img/no-image.jpg' }
});

GameSchema.virtual('url').get(function () {
  return '/game/' + this._id;
});

GameSchema.virtual('release_date_formatted').get(function () {
  if (this.release_date === null) return 'Unknown';
  else {
    return DateTime.fromJSDate(this.release_date)
      .toLocaleString(DateTime.DATE_MED);
  }
});

GameSchema.virtual('release_date_form_value').get(function () {
  if (this.release_date === null) return '';

  let year = new Date(this.release_date).getFullYear();
  let month = new Date(this.release_date).getMonth() + 1;
  let day = new Date(this.release_date).getDate();

  month = month.toString().length == 1 ? '0' + month : month;
  day = day.toString().length == 1 ? '0' + day : day;

  return `${year}-${month}-${day}`;
})

module.exports = mongoose.model('Game', GameSchema);
