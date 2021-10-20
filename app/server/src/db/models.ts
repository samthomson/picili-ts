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
