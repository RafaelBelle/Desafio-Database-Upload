import Transaction from '../models/Transaction';
import fs from 'fs';
import csvParse from 'csv-parse';
import {getCustomRepository, getRepository, In} from 'typeorm';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  file: string;
}

interface ArrayTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ file }: Request): Promise<Transaction[]> {
    const fileStream = fs.createReadStream(file);

    const parses = csvParse({
      from_line: 2
    });

    const parseCsv = fileStream.pipe(parses);
    const transactions: ArrayTransaction[] = [];
    const categories: string[] = [];

    parseCsv.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) => cell.trim());

      categories.push(category);
      transactions.push({title, type, value, category});
    });

    await new Promise(resolve => parseCsv.on('end', resolve));

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const existentCategories = await categoriesRepository.find({
      where: { title: In(categories)}
    });

    const existentCategoriesTitle = existentCategories.map(c => c.title);

    const nonExistentCategoriesTitles = categories.filter(c => !existentCategoriesTitle.includes(c))
    .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      nonExistentCategoriesTitles.map(c => ({title: c}))
    );

    await categoriesRepository.save(newCategories);

    const arrayObjectCategories = [...existentCategoriesTitle, ...nonExistentCategoriesTitles];

    const newTransactions = transactionsRepository.create(
      transactions.map(t => ({
        title: t.title,
        type: t.type,
        value: t.value,
        category: arrayObjectCategories.find(c => c === t.category)
      }))
    );

    await transactionsRepository.save(newTransactions);

    await fs.promises.unlink(file);

    return newTransactions;
  }
}

export default ImportTransactionsService;
