package ru.biomedis.trinity.backend;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Future;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.sql2o.Connection;
import org.sql2o.Sql2o;

/**
 * Created by anama on 13.03.17.
 */
public class DataModel extends AbstractVerticle {

    private Sql2o sql2o;
    private static final Logger logger = LogManager.getLogger(DataModel.class.getName());
    public DataModel() {
    }

    @Override
    public void start(Future<Void> startFuture) throws Exception {
        logger.info("Инициализация базы данных");
        sql2o = new Sql2o("jdbc:h2:./store", "sa", "");
        if(sql2o==null) startFuture.fail("Не удалось подключение к базе данных");
        try(Connection con = sql2o.open()) {
            startFuture.complete();
        }catch (Exception e){
            startFuture.fail(e);
        }

    }


}
