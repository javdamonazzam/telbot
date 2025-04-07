import { Injectable, OnModuleInit } from '@nestjs/common';
import { Telegraf, Markup } from 'telegraf';
import axios from 'axios';
import * as QRCode from 'qrcode';

@Injectable()
export class TelegramService implements OnModuleInit {
    private bot: Telegraf;

    constructor(

    ) {
        this.bot = new Telegraf('7897182934:AAFR8JohENrZaEaPo9jv5XO_fcTJ7pLf5zI');
    }

    async onModuleInit() {
        this.bot.start(async (ctx) => {
            const chatId = ctx.message.chat.id;
            const res = await axios.post('http://localhost:8001/telegram/start', {
                "chatId": chatId
            });
            await ctx.reply(`${chatId}`)
            await ctx.reply(
                'یکی از گزینه‌های زیر را انتخاب کنید:',
                Markup.keyboard([
                    ['🔄 تمدید سرویس', '🛒 خرید سرویس'],

                    ['تعویض سرویس']
                ]).resize()
            );
        });

        // ✅ پردازش خرید سرویس 
        this.bot.hears('🛒 خرید سرویس', async (ctx) => {
            const chatId = ctx.message.chat.id;
            const res = await axios.post('http://localhost:8001/telegram/balance', {
                "chatId": chatId
            });
            await ctx.reply(
                "⏳ لطفاً مدت زمان اشتراک را انتخاب کنید:",
                Markup.keyboard([
                    ["2️⃣ دوماهه", "1️⃣ یک‌ماهه"],
                    ["6️⃣ شش‌ماهه", "3️⃣ سه‌ماهه"],
                    [`💰 ${res.data.data.wallet.wallet_balance.toLocaleString('fa-IR')} هزارتومان`],
                    ["❌ لغو"]
                ]).resize()
            );
        });
        // ✅ پردازش مدت زمان اشتراک
        this.bot.hears(["1️⃣ یک‌ماهه", "2️⃣ دوماهه", "3️⃣ سه‌ماهه", "6️⃣ شش‌ماهه"], async (ctx) => {
            const chatId = ctx.message.chat.id;

            const res = await axios.post('http://localhost:8001/telegram/balance', {
                "chatId": chatId
            });


            let months = 1;
            switch (ctx.message.text) {
                case "2️⃣ دوماهه": months = 2; break;
                case "3️⃣ سه‌ماهه": months = 3; break;
                case "6️⃣ شش‌ماهه": months = 6; break;
                case "9️⃣ نه‌ماهه": months = 9; break;
                case "1️⃣2️⃣ دوازده‌ماهه": months = 12; break;
            }

            const cost = Math.floor(months * res.data.data.user.account_price)
            if (res.data.data.wallet.wallet_balance < cost) {
                await ctx.reply("❌ موجودی کیف پول شما کافی نیست. لطفاً ابتدا موجودی خود را افزایش دهید.");
                return;
            }
            await ctx.reply("⏳ لطفاً منتظر بمانید، در حال ساخت کانفیگ...");
            //   const config = await axios.post('http://localhost:5000/tel/create',{ ip: '213.159.73.194', id: res.data.data.user_id, month: months, title: "b" });
            console.log(res.data.data.user.id);
            const res1 = await axios.post('http://localhost:8001/telegram/config', {
                ip: '213.159.73.194',
                id: res.data.data.user.id,
                month: months,
                title: "b"
            });

            const config = res1.data.data

            const buffer = Buffer.from(config.server_info, 'utf-8');
            await ctx.replyWithDocument({ source: buffer, filename: `${config.title}.conf` });

            const qrBuffer = await QRCode.toBuffer(config.server_info);
            await ctx.replyWithPhoto({ source: qrBuffer });

            await ctx.reply("✅ کانفیگ شما ساخته شد! برای اطلاعات بیشتر به پشتیبانی پیام دهید.");
        });
        this.bot.hears("❌ لغو", async (ctx) => {
            const chatId = ctx.message.chat.id;
            await ctx.reply(
                'یکی از گزینه‌های زیر را انتخاب کنید:',
                Markup.keyboard([
                    //   [`💰 ${user_wallet.wallet_balance.toLocaleString('fa-IR')} هزارتومان`],
                    ['🔄 تمدید سرویس', '🛒 خرید سرویس'],
                    ['تعویض سرویس']
                ]).resize()
            );
        });
        // ✅ پردازش تمدید سرویس
        this.bot.hears('🔄 تمدید سرویس', async (ctx) => {
            await ctx.reply('🔄 لطفاً اطلاعات تمدید را وارد کنید.');
        });

        await this.bot.launch();
    }
}
