import * as Sequelize from 'sequelize'
import Database from './connection'

interface UserAttributes {
    id: string
    email: string
    password: string
}
type UserCreationAttributes = Sequelize.Optional<UserAttributes, 'id'>

export interface UserInstance extends Sequelize.Model<UserAttributes, UserCreationAttributes>, UserAttributes {
    createdAt?: Date
    updatedAt?: Date
}

export const UserModel = Database.define<UserInstance>(
    'users',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        email: Sequelize.STRING,
        password: Sequelize.STRING,
    },
    {
        timestamps: true,
        underscored: true,
    },
)

interface DropboxConnectionAttributes {
    id: string
    userId: number
    token: string
    syncPath?: string
    syncEnabled?: boolean
}
type DropboxConnectionCreationAttributes = Sequelize.Optional<DropboxConnectionAttributes, 'id'>

export interface DropboxConnectionInstance
    extends Sequelize.Model<DropboxConnectionAttributes, DropboxConnectionCreationAttributes>,
        UserAttributes {
    createdAt?: Date
    updatedAt?: Date
}

export const DropboxConnectionModel = Database.define<DropboxConnectionInstance>(
    'dropbox_connection',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: Sequelize.INTEGER.UNSIGNED,
        token: Sequelize.STRING,
        syncPath: Sequelize.STRING,
        syncEnabled: Sequelize.BOOLEAN,
    },
    {
        timestamps: true,
        underscored: true,
    },
)
