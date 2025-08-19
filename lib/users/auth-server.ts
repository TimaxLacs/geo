import { Hasyx } from 'hasyx';

/**
 * Интерфейс для данных пользователя
 */
interface UserData {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  photo_url?: string;
  [key: string]: any;
}

/**
 * Интерфейс для аккаунта
 */
interface AccountData {
  provider: string;
  providerAccountId: string;
  userId: string;
  type: string;
  [key: string]: any;
}

/**
 * Получение или создание пользователя и аккаунта
 */
export async function getOrCreateUserAndAccount(
  hasyx: Hasyx, 
  provider: string, 
  userData: UserData
): Promise<{ user: any; account: any }> {
  try {
    // Ищем существующий аккаунт
    const existingAccounts = await hasyx.select({
      table: 'accounts',
      where: {
        provider: { _eq: provider },
        providerAccountId: { _eq: userData.id }
      },
      returning: ['*']
    });

    let user: any;
    let account: any;

    if (existingAccounts && existingAccounts.length > 0) {
      // Аккаунт уже существует, получаем пользователя
      account = existingAccounts[0];
      
      const existingUsers = await hasyx.select({
        table: 'users',
        where: { id: { _eq: account.userId } },
        returning: ['*']
      });

      user = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;
    }

    if (!user) {
      // Создаем нового пользователя
      const newUser = {
        id: userData.id,
        name: userData.first_name + (userData.last_name ? ` ${userData.last_name}` : ''),
        email: userData.email || null,
        image: userData.photo_url || null,
        username: userData.username || null,
        created_at: new Date().valueOf(),
        updated_at: new Date().valueOf()
      };

      const createdUsers = await hasyx.insert({
        table: 'users',
        object: newUser,
        returning: ['*']
      });

      user = createdUsers && createdUsers.length > 0 ? createdUsers[0] : newUser;
    }

    if (!account) {
      // Создаем новый аккаунт
      const newAccount: AccountData = {
        provider,
        providerAccountId: userData.id,
        userId: user.id,
        type: 'oauth',
        created_at: new Date().valueOf(),
        updated_at: new Date().valueOf()
      };

      const createdAccounts = await hasyx.insert({
        table: 'accounts',
        object: newAccount,
        returning: ['*']
      });

      account = createdAccounts && createdAccounts.length > 0 ? createdAccounts[0] : newAccount;
    }

    return { user, account };
  } catch (error) {
    console.error('Error in getOrCreateUserAndAccount:', error);
    
    // Возвращаем базовые объекты в случае ошибки
    const fallbackUser = {
      id: userData.id,
      name: userData.first_name + (userData.last_name ? ` ${userData.last_name}` : ''),
      email: userData.email || null,
      image: userData.photo_url || null,
      username: userData.username || null
    };

    const fallbackAccount = {
      provider,
      providerAccountId: userData.id,
      userId: userData.id,
      type: 'oauth'
    };

    return { user: fallbackUser, account: fallbackAccount };
  }
}
